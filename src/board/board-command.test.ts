import { describe, expect, test } from 'bun:test';
import { createBoardCommandManager } from './board-command';
import { createBoardRuntime } from './board-runtime';

function createRuntime() {
  return createBoardRuntime({
    enabled: true,
    defaultMode: 'route',
    councilEscalation: true,
    roles: {
      backend: {
        title: 'Backend Architect',
        purpose: 'Backend APIs and data modeling',
        when: ['api', 'database'],
        outputs: ['recommendation'],
        agent: 'backend-architect',
        priority: 70,
      },
      security: {
        title: 'Security Advisor',
        purpose: 'Security for API auth',
        when: ['auth', 'security', 'api'],
        outputs: ['risk review'],
        agent: 'security-advisor',
        priority: 90,
      },
    },
  });
}

function createOutput() {
  return { parts: [] as Array<{ type: string; text?: string }> };
}

function getOutputText(output: ReturnType<typeof createOutput>): string {
  return output.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('\n');
}

describe('createBoardCommandManager', () => {
  test('non-board commands are no-op', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'preset', arguments: 'cheap' },
      output,
    );

    expect(output.parts).toHaveLength(0);
  });

  test('registerCommand adds command and preserves existing command', () => {
    const manager = createBoardCommandManager(createRuntime());
    const config: Record<string, unknown> = {};

    manager.registerCommand(config);

    const commands = config.command as Record<string, { template: string }>;
    expect(commands.board).toBeDefined();
    expect(commands.board.template).toContain('/board status');

    const existingConfig: Record<string, unknown> = {
      command: {
        board: {
          template: 'custom template',
          description: 'custom description',
        },
      },
    };

    manager.registerCommand(existingConfig);
    const existingCommands = existingConfig.command as Record<
      string,
      { template: string }
    >;
    expect(existingCommands.board.template).toBe('custom template');
  });

  test('empty arguments returns status output', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: '' },
      output,
    );

    const text = getOutputText(output);
    expect(text).toContain('Board Runtime');
  });

  test('help and status return status output', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const helpOutput = createOutput();
    const statusOutput = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'help' },
      helpOutput,
    );
    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'status' },
      statusOutput,
    );

    expect(getOutputText(helpOutput)).toContain('Board Runtime');
    expect(getOutputText(statusOutput)).toContain('Board Runtime');
  });

  test('status includes enabled, mode, council, roles, and decisions', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'status' },
      output,
    );

    const text = getOutputText(output);
    expect(text).toContain('enabled: true');
    expect(text).toContain('mode: route');
    expect(text).toContain('council escalation: true');
    expect(text).toContain('roles: 2');
    expect(text).toContain('recent decisions: 0');
  });

  test('roles lists configured roles', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'roles' },
      output,
    );

    const text = getOutputText(output);
    expect(text).toContain('Board Roles');
    expect(text).toContain(
      'backend: Backend Architect -> @backend-architect (priority 70)',
    );
    expect(text).toContain(
      'security: Security Advisor -> @security-advisor (priority 90)',
    );
  });

  test('route records decision and outputs action and candidates', async () => {
    const runtime = createRuntime();
    const manager = createBoardCommandManager(runtime);
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'route Design API auth' },
      output,
    );

    const text = getOutputText(output);
    expect(text).toContain('Board Route');
    expect(text).toContain('input: Design API auth');
    expect(text).toContain('action: delegate -> @security-advisor');
    expect(text).toContain('reason: Board selected Security Advisor.');
    expect(text).toContain('candidates: security, backend');
    expect(runtime.getRecentDecisions()).toHaveLength(1);
  });

  test('route with no request outputs usage', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'route' },
      output,
    );

    expect(getOutputText(output)).toContain('Usage: /board route <request>');
  });

  test('unknown subcommand outputs usage message', async () => {
    const manager = createBoardCommandManager(createRuntime());
    const output = createOutput();

    await manager.handleCommandExecuteBefore(
      { command: 'board', arguments: 'wat' },
      output,
    );

    const text = getOutputText(output);
    expect(text).toContain('Unknown board command "wat".');
    expect(text).toContain(
      '/board status, /board roles, /board route <request>',
    );
  });
});
