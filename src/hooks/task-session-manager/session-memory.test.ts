import { describe, expect, test } from 'bun:test';
import { createDelegatedSessionMemory } from './session-memory';

describe('createDelegatedSessionMemory', () => {
  test('remembers and resolves a delegated session by alias', () => {
    const memory = createDelegatedSessionMemory({ maxSessionsPerAgent: 2 });

    memory.remember({
      parentSessionId: 'parent',
      taskId: 'ses_1234567890abcdef',
      agentType: 'explorer',
      label: 'Config scan',
    });

    expect(
      memory.resolve({
        parentSessionId: 'parent',
        agentType: 'explorer',
        taskId: 'exp-1',
      })?.taskId,
    ).toBe('ses_1234567890abcdef');
  });

  test('resolving an alias refreshes recency before later eviction', () => {
    const memory = createDelegatedSessionMemory({ maxSessionsPerAgent: 2 });

    memory.remember({
      parentSessionId: 'parent',
      taskId: 'child-1',
      agentType: 'explorer',
      label: 'First scan',
    });
    memory.remember({
      parentSessionId: 'parent',
      taskId: 'child-2',
      agentType: 'explorer',
      label: 'Second scan',
    });

    expect(
      memory.resolve({
        parentSessionId: 'parent',
        agentType: 'explorer',
        taskId: 'exp-1',
      })?.taskId,
    ).toBe('child-1');

    memory.remember({
      parentSessionId: 'parent',
      taskId: 'child-3',
      agentType: 'explorer',
      label: 'Third scan',
    });

    expect(
      memory.resolve({
        parentSessionId: 'parent',
        agentType: 'explorer',
        taskId: 'child-1',
      })?.taskId,
    ).toBe('child-1');
    expect(
      memory.resolve({
        parentSessionId: 'parent',
        agentType: 'explorer',
        taskId: 'child-2',
      }),
    ).toBeUndefined();
  });

  test('enrich derives pending task metadata from task args', () => {
    const memory = createDelegatedSessionMemory({ maxSessionsPerAgent: 2 });

    const enriched = memory.enrich({
      sessionID: 'parent',
      tool: 'task',
      args: {
        subagent_type: 'oracle',
        description: 'Architecture review',
        prompt: 'review architecture',
      },
    });

    expect(enriched?.pending).toEqual({
      parentSessionId: 'parent',
      agentType: 'oracle',
      label: 'Architecture review',
      prompt: 'review architecture',
    });
  });

  test('purge clears parent session memory', () => {
    const memory = createDelegatedSessionMemory({ maxSessionsPerAgent: 2 });

    memory.remember({
      parentSessionId: 'parent',
      taskId: 'task-1',
      agentType: 'explorer',
      label: 'Config scan',
    });

    memory.purge({ sessionID: 'parent', status: 'deleted' });

    expect(memory.formatForPrompt('parent')).toBeUndefined();
  });
});
