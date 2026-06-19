import { describe, expect, mock, test } from 'bun:test';
import { BackgroundJobBoard } from '../../utils/background-job-board';
import { createTaskSessionManagerHook } from './index';

function createHook(options?: {
  shouldManageSession?: (sessionID: string) => boolean;
  readContextMinLines?: number;
  readContextMaxFiles?: number;
  backgroundJobBoard?: BackgroundJobBoard;
}) {
  const hook = createTaskSessionManagerHook(
    {
      client: { session: { status: mock(async () => ({ data: {} })) } },
      directory: '/tmp',
      worktree: '/tmp',
    } as never,
    {
      maxSessionsPerAgent: 2,
      readContextMinLines: options?.readContextMinLines,
      readContextMaxFiles: options?.readContextMaxFiles,
      shouldManageSession: options?.shouldManageSession ?? (() => true),
      backgroundJobBoard: options?.backgroundJobBoard,
    },
  );

  return { hook };
}

function createMessages(sessionID: string, text = 'user message') {
  return {
    messages: [
      {
        info: { role: 'user', agent: 'orchestrator', sessionID },
        parts: [{ type: 'text', text }],
      },
    ],
  };
}

describe('task-session-manager hook', () => {
  test('stores task sessions and injects resumable-session block into user message', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
          prompt: 'inspect config schema',
        },
      },
    );

    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const userMessage = messages.messages[0];
    expect(userMessage.parts[0].text).toContain('<resumable_sessions>');
    expect(userMessage.parts[0].text).toContain('### Resumable Sessions');
    expect(userMessage.parts[0].text).toContain(
      'explorer: exp-1 config schema',
    );
    expect(userMessage.parts[0].text).toContain('</resumable_sessions>');
  });

  test('does not expose a system transform for resumable sessions', async () => {
    const { hook } = createHook();
    expect('experimental.chat.system.transform' in hook).toBe(false);
  });

  test('resolves remembered aliases to real task ids before execution', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
          prompt: 'inspect config schema',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const next = {
      args: {
        subagent_type: 'explorer',
        description: 'continue schema work',
        task_id: 'exp-1',
      },
    };
    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      next,
    );

    expect(next.args.task_id).toBe('child-1');
  });

  test('records launched tasks in the background job board', async () => {
    const backgroundJobBoard = new BackgroundJobBoard();
    const { hook } = createHook({ backgroundJobBoard });

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
          prompt: 'inspect config schema deeply',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const job = backgroundJobBoard.resolve('parent-1', 'exp-1');
    expect(job?.taskID).toBe('child-1');
    expect(job?.agent).toBe('explorer');
    expect(job?.description).toBe('config schema');
    expect(job?.objective).toBe('inspect config schema deeply');
    expect(job?.state).toBe('completed');
  });

  test('session.deleted does not overwrite cancelled background job state', async () => {
    const backgroundJobBoard = new BackgroundJobBoard();
    const { hook } = createHook({ backgroundJobBoard });

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      { args: { subagent_type: 'explorer', description: 'config schema' } },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );
    backgroundJobBoard.markCancellationRequested('child-1');

    await hook.event({
      event: {
        type: 'session.deleted',
        properties: { info: { id: 'child-1', parentID: 'parent-1' } },
      },
    });

    const job = backgroundJobBoard.get('child-1');
    expect(job?.state).toBe('cancelled');
    expect(job?.statusUncertain).toBe(false);
  });

  test('idle child status injects unreconciled background job for parent pickup', async () => {
    const backgroundJobBoard = new BackgroundJobBoard();
    const { hook } = createHook({ backgroundJobBoard });

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        args: {
          subagent_type: 'oracle',
          description: 'architecture review',
          prompt: 'review architecture',
        },
      },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    await hook.event({
      event: {
        type: 'session.status',
        properties: { sessionID: 'child-1', status: { type: 'idle' } },
      },
    });

    expect(backgroundJobBoard.get('child-1')?.terminalUnreconciled).toBe(true);

    const messages = createMessages('parent-1', 'continue');
    await hook['experimental.chat.messages.transform']({}, messages);

    const text = messages.messages[0]?.parts[0]?.text ?? '';
    expect(text).toContain('<background_jobs>');
    expect(text).toContain('ora-1 [completed] oracle: architecture review');
    expect(text).toContain('unreconciled');
    expect(backgroundJobBoard.get('child-1')?.state).toBe('reconciled');
    expect(backgroundJobBoard.get('child-1')?.terminalUnreconciled).toBe(false);
  });

  test('marks missing resumed tasks uncertain in the background job board', async () => {
    const backgroundJobBoard = new BackgroundJobBoard();
    const { hook } = createHook({ backgroundJobBoard });

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      { args: { subagent_type: 'explorer', description: 'config schema' } },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const next = {
      args: {
        subagent_type: 'explorer',
        description: 'continue schema work',
        task_id: 'exp-1',
      },
    };
    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-2' },
      next,
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-2' },
      { output: '[ERROR] Session not found' },
    );

    const job = backgroundJobBoard.get('child-1');
    expect(job?.state).toBe('unknown');
    expect(job?.statusUncertain).toBe(true);
  });

  test('tracks files read by child sessions in resumable message context', async () => {
    const { hook } = createHook();

    await hook.event({
      event: {
        type: 'session.created',
        properties: { info: { id: 'child-1', parentID: 'parent-1' } },
      },
    });

    await hook['tool.execute.after'](
      {
        tool: 'read',
        sessionID: 'child-1',
        callID: 'read-1',
      },
      {
        output: [
          '<path>/tmp/src/index.ts</path>',
          '<type>file</type>',
          '<content>',
          ...Array.from({ length: 12 }, (_, index) => `${index + 1}: line`),
          '</content>',
        ].join('\n'),
        metadata: {
          loaded: ['/tmp/AGENTS.md'],
        },
      },
    );

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'session files',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const userMessage = messages.messages[0];
    expect(userMessage.parts[0].text).toContain('exp-1 session files');
    expect(userMessage.parts[0].text).toContain(
      'Context read by exp-1: src/index.ts (12 lines)',
    );
  });

  test('accumulates multiple reads and hides tiny read context', async () => {
    const { hook } = createHook();

    await hook.event({
      event: {
        type: 'session.created',
        properties: { info: { id: 'child-1', parentID: 'parent-1' } },
      },
    });

    await hook['tool.execute.after'](
      { tool: 'read', sessionID: 'child-1', callID: 'read-1' },
      {
        output: [
          '<path>/tmp/src/small.ts</path>',
          '<content>',
          ...Array.from({ length: 4 }, (_, index) => `${index + 1}: line`),
          '</content>',
        ].join('\n'),
      },
    );
    await hook['tool.execute.after'](
      { tool: 'read', sessionID: 'child-1', callID: 'read-2' },
      {
        output: [
          '<path>/tmp/src/large.ts</path>',
          '<content>',
          ...Array.from({ length: 7 }, (_, index) => `${index + 1}: line`),
          '</content>',
        ].join('\n'),
      },
    );
    await hook['tool.execute.after'](
      { tool: 'read', sessionID: 'child-1', callID: 'read-3' },
      {
        output: [
          '<path>/tmp/src/large.ts</path>',
          '<content>',
          ...Array.from({ length: 5 }, (_, index) => `${index + 8}: line`),
          '</content>',
        ].join('\n'),
      },
    );

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      { args: { subagent_type: 'explorer', description: 'line counts' } },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const prompt = messages.messages[0].parts[0].text;
    expect(prompt).not.toContain('small.ts');
    expect(prompt).toContain('src/large.ts (12 lines)');
  });

  test('counts overlapping repeated reads once per unique line', async () => {
    const { hook } = createHook();

    await hook.event({
      event: {
        type: 'session.created',
        properties: { info: { id: 'child-1', parentID: 'parent-1' } },
      },
    });
    for (const call of ['read-1', 'read-2']) {
      await hook['tool.execute.after'](
        { tool: 'read', sessionID: 'child-1', callID: call },
        {
          output: [
            '<path>/tmp/src/repeat.ts</path>',
            '<content>',
            ...Array.from({ length: 12 }, (_, index) => `${index + 1}: line`),
            '</content>',
          ].join('\n'),
        },
      );
    }

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      { args: { subagent_type: 'explorer', description: 'repeat reads' } },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const prompt = messages.messages[0].parts[0].text;
    expect(prompt).toContain('src/repeat.ts (12 lines)');
    expect(prompt).not.toContain('src/repeat.ts (24 lines)');
  });

  test('uses configured read context thresholds', async () => {
    const { hook } = createHook({
      readContextMinLines: 5,
      readContextMaxFiles: 1,
    });

    await hook.event({
      event: {
        type: 'session.created',
        properties: { info: { id: 'child-1', parentID: 'parent-1' } },
      },
    });
    for (const [file, lines] of [
      ['small.ts', 4],
      ['medium.ts', 5],
      ['large.ts', 12],
    ] as const) {
      await hook['tool.execute.after'](
        { tool: 'read', sessionID: 'child-1', callID: `read-${file}` },
        {
          output: [
            `<path>/tmp/src/${file}</path>`,
            '<content>',
            ...Array.from({ length: lines }, (_, line) => `${line + 1}: line`),
            '</content>',
          ].join('\n'),
        },
      );
    }

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      { args: { subagent_type: 'explorer', description: 'configured caps' } },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const prompt = messages.messages[0].parts[0].text;
    expect(prompt).not.toContain('small.ts');
    expect(prompt).toContain('Context read by exp-1:');
    expect(prompt).toContain('(+1 more)');
  });

  test('ignores reads from unmanaged child sessions', async () => {
    const { hook } = createHook({
      shouldManageSession: (sessionID) => sessionID === 'parent-1',
    });

    await hook.event({
      event: {
        type: 'session.created',
        properties: { info: { id: 'child-1', parentID: 'other-parent' } },
      },
    });
    await hook['tool.execute.after'](
      { tool: 'read', sessionID: 'child-1', callID: 'read-1' },
      {
        output: [
          '<path>/tmp/src/index.ts</path>',
          '<content>',
          ...Array.from({ length: 12 }, (_, index) => `${index + 1}: line`),
          '</content>',
        ].join('\n'),
      },
    );

    await hook['tool.execute.before'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      { args: { subagent_type: 'explorer', description: 'unmanaged read' } },
    );
    await hook['tool.execute.after'](
      { tool: 'task', sessionID: 'parent-1', callID: 'call-1' },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const prompt = messages.messages[0].parts[0].text;
    expect(prompt).toContain('exp-1 unmanaged read');
    expect(prompt).not.toContain('Context read by exp-1');
  });

  test('prunes read context when remembered sessions are evicted', async () => {
    const { hook } = createHook();

    for (const index of [1, 2, 3]) {
      await hook.event({
        event: {
          type: 'session.created',
          properties: {
            info: { id: `child-${index}`, parentID: 'parent-1' },
          },
        },
      });
      await hook['tool.execute.after'](
        { tool: 'read', sessionID: `child-${index}`, callID: `read-${index}` },
        {
          output: [
            `<path>/tmp/src/file-${index}.ts</path>`,
            '<content>',
            ...Array.from({ length: 12 }, (_, line) => `${line + 1}: line`),
            '</content>',
          ].join('\n'),
        },
      );
      await hook['tool.execute.before'](
        { tool: 'task', sessionID: 'parent-1', callID: `call-${index}` },
        { args: { subagent_type: 'explorer', description: `thread ${index}` } },
      );
      await hook['tool.execute.after'](
        { tool: 'task', sessionID: 'parent-1', callID: `call-${index}` },
        {
          output: `task_id: child-${index} (for resuming to continue this task if needed)`,
        },
      );
    }

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const prompt = messages.messages[0].parts[0].text;
    expect(prompt).not.toContain('exp-1 thread 1');
    expect(prompt).not.toContain('file-1.ts');
    expect(prompt).toContain('exp-2 thread 2');
    expect(prompt).toContain('file-2.ts (12 lines)');
    expect(prompt).toContain('exp-3 thread 3');
    expect(prompt).toContain('file-3.ts (12 lines)');
  });

  test('drops stale remembered sessions and falls back to fresh', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const next = {
      args: {
        subagent_type: 'explorer',
        description: 'continue schema work',
        task_id: 'exp-1',
      },
    };
    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      next,
    );

    expect(next.args.task_id).toBe('child-1');

    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        output: '[ERROR] Session not found',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);
    expect(messages.messages[0].parts[0].text).not.toContain('exp-1');
  });

  test('drops resumed predecessor when success returns a new task id', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'continue schema work',
          task_id: 'exp-1',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        output:
          'task_id: child-2 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    const prompt = messages.messages[0].parts[0].text;
    expect(prompt).toContain('continue schema work');
    expect(prompt).not.toContain('config schema');
  });

  test('does not drop remembered session on non-runtime session text', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'continue schema work',
          task_id: 'exp-1',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        output: 'Found no session cookies in fixtures, continuing analysis.',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    expect(messages.messages[0].parts[0].text).toContain('exp-1 config schema');
  });

  test('ignores sessions that are not orchestrator-managed', async () => {
    const { hook } = createHook({ shouldManageSession: () => false });

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'manual-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'manual-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('manual-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    // Message should remain unchanged
    expect(messages.messages[0].parts[0].text).toBe('do something');
  });

  test('cleans up remembered sessions when parent or child is deleted', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'oracle',
          description: 'architecture review',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    await hook.event({
      event: {
        type: 'session.deleted',
        properties: { sessionID: 'child-1' },
      },
    });

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);
    // Message should remain unchanged since session was deleted
    expect(messages.messages[0].parts[0].text).toBe('do something');
  });

  test('cleans pending calls when parent session is deleted', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'oracle',
          description: 'architecture review',
        },
      },
    );

    await hook.event({
      event: {
        type: 'session.deleted',
        properties: { sessionID: 'parent-1' },
      },
    });

    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    // Message should remain unchanged since session was deleted
    expect(messages.messages[0].parts[0].text).toBe('do something');
  });

  test('deduplicates pending call order when a resume call is recorded twice', async () => {
    const { hook } = createHook();

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'config schema',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-1',
      },
      {
        output:
          'task_id: child-1 (for resuming to continue this task if needed)',
      },
    );

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        args: {
          subagent_type: 'explorer',
          description: 'continue schema work',
          task_id: 'exp-1',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-2',
      },
      {
        output: '[ERROR] Session not found',
      },
    );

    await hook['tool.execute.before'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-3',
      },
      {
        args: {
          subagent_type: 'oracle',
          description: 'architecture review',
        },
      },
    );
    await hook['tool.execute.after'](
      {
        tool: 'task',
        sessionID: 'parent-1',
        callID: 'call-3',
      },
      {
        output:
          'task_id: child-3 (for resuming to continue this task if needed)',
      },
    );

    const messages = createMessages('parent-1', 'do something');
    await hook['experimental.chat.messages.transform']({}, messages);

    expect(messages.messages[0].parts[0].text).toContain(
      'oracle: ora-1 architecture review',
    );
  });
});
