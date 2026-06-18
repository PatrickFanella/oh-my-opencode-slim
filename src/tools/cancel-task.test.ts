import { describe, expect, mock, test } from 'bun:test';
import { BackgroundJobBoard } from '../utils/background-job-board';
import { createCancelTaskTool } from './cancel-task';

function createClient(abortImpl: () => Promise<unknown> = async () => ({})) {
  return {
    session: {
      abort: mock(abortImpl),
    },
  } as any;
}

function seedBoard(state: 'pending' | 'running' | 'completed' = 'running') {
  const board = new BackgroundJobBoard();
  board.recordLaunch({
    parentSessionID: 'parent-1',
    taskID: 'child-1',
    agent: 'explorer',
    description: 'map files',
    objective: 'find relevant code',
    source: 'task',
  });
  board.updateState('child-1', state);
  return board;
}

describe('cancel_task tool', () => {
  test('cancels by background job alias', async () => {
    const board = seedBoard();
    const client = createClient();
    const cancelTask = createCancelTaskTool({
      client,
      backgroundJobBoard: board,
    });

    const result = await cancelTask.execute({ id: 'exp-1' }, {
      sessionID: 'parent-1',
      directory: '/tmp/project',
    } as never);

    expect(result).toContain('Cancellation sent');
    expect(client.session.abort).toHaveBeenCalledWith({
      path: { id: 'child-1' },
      query: { directory: '/tmp/project' },
    });
    expect(board.get('child-1')?.state).toBe('cancelled');
  });

  test('cancels by raw task id when owned by current session', async () => {
    const board = seedBoard();
    const client = createClient();
    const cancelTask = createCancelTaskTool({
      client,
      backgroundJobBoard: board,
    });

    const result = await cancelTask.execute({ id: 'child-1' }, {
      sessionID: 'parent-1',
    } as never);

    expect(result).toContain('child-1');
    expect(client.session.abort).toHaveBeenCalledTimes(1);
    expect(board.get('child-1')?.state).toBe('cancelled');
  });

  test('does not cancel raw task id owned by another parent', async () => {
    const board = seedBoard();
    const client = createClient();
    const cancelTask = createCancelTaskTool({
      client,
      backgroundJobBoard: board,
    });

    const result = await cancelTask.execute({ id: 'child-1' }, {
      sessionID: 'parent-2',
    } as never);

    expect(result).toContain('No tracked delegated task matched');
    expect(client.session.abort).not.toHaveBeenCalled();
    expect(board.get('child-1')?.state).toBe('running');
  });

  test('unknown id returns known aliases', async () => {
    const board = seedBoard();
    const client = createClient();
    const cancelTask = createCancelTaskTool({
      client,
      backgroundJobBoard: board,
    });

    const result = await cancelTask.execute({ id: 'missing' }, {
      sessionID: 'parent-1',
    } as never);

    expect(result).toContain('No tracked delegated task matched "missing"');
    expect(result).toContain('exp-1 (child-1)');
    expect(client.session.abort).not.toHaveBeenCalled();
  });

  test('already completed job is idempotent', async () => {
    const board = seedBoard('completed');
    const client = createClient();
    const cancelTask = createCancelTaskTool({
      client,
      backgroundJobBoard: board,
    });

    const result = await cancelTask.execute({ id: 'exp-1' }, {
      sessionID: 'parent-1',
    } as never);

    expect(result).toContain('already completed');
    expect(client.session.abort).not.toHaveBeenCalled();
    expect(board.get('child-1')?.state).toBe('completed');
  });

  test('abort timeout marks task status uncertain without hanging', async () => {
    const board = seedBoard();
    const client = createClient(
      () => new Promise((resolve) => setTimeout(resolve, 50)),
    );
    const cancelTask = createCancelTaskTool({
      client,
      backgroundJobBoard: board,
      abortTimeoutMs: 1,
    });

    const result = await cancelTask.execute({ id: 'exp-1' }, {
      sessionID: 'parent-1',
    } as never);

    expect(result).toContain('timed out');
    expect(board.get('child-1')?.state).toBe('unknown');
    expect(board.get('child-1')?.statusUncertain).toBe(true);
  });
});
