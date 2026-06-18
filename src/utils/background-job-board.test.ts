import { describe, expect, test } from 'bun:test';
import { BackgroundJobBoard } from './background-job-board';

describe('BackgroundJobBoard', () => {
  test('creates parent-scoped aliases by agent prefix', () => {
    const board = new BackgroundJobBoard();

    const job = board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'explorer',
      description: 'map files',
      objective: 'find relevant code',
      source: 'task',
    });

    expect(job.alias).toBe('exp-1');
    expect(board.resolve('parent-1', 'exp-1')?.taskID).toBe('task-1');
    expect(board.resolve('other-parent', 'exp-1')).toBeUndefined();
  });

  test('updates states idempotently', () => {
    const board = new BackgroundJobBoard();
    board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'fixer',
      description: 'edit file',
      objective: 'apply bounded change',
      source: 'task',
    });

    board.updateState('task-1', 'running');
    board.updateState('task-1', 'running');

    expect(board.get('task-1')?.state).toBe('running');
  });

  test('marks cancellation requested without deleting the job', () => {
    const board = new BackgroundJobBoard();
    board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'oracle',
      description: 'review plan',
      objective: 'advise',
      source: 'task',
    });

    board.markCancellationRequested('task-1');

    expect(board.get('task-1')?.cancellationRequested).toBe(true);
    expect(board.get('task-1')?.state).toBe('cancelling');
  });

  test('keeps aliases stable when duplicate launches update a job', () => {
    const board = new BackgroundJobBoard();

    board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'explorer',
      description: 'first label',
      objective: 'first objective',
      source: 'task',
    });
    const updated = board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'explorer',
      description: 'updated label',
      objective: 'updated objective',
      source: 'task',
      contextFiles: ['src/index.ts'],
    });

    expect(updated.alias).toBe('exp-1');
    expect(updated.description).toBe('updated label');
    expect(updated.contextFiles).toEqual(['src/index.ts']);
    expect(board.listForParent('parent-1')).toHaveLength(1);
  });

  test('formats parent jobs for prompt injection', () => {
    const board = new BackgroundJobBoard();
    board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'explorer',
      description: 'map files',
      objective: 'find relevant code',
      source: 'task',
    });
    board.updateState('task-1', 'running', { statusUncertain: true });

    expect(board.formatForPrompt('parent-1')).toContain('### Background Jobs');
    expect(board.formatForPrompt('parent-1')).toContain(
      '- exp-1 [running] explorer: map files (uncertain)',
    );
    expect(board.formatForPrompt('other-parent')).toBe('');
  });

  test('removes parent jobs and aliases', () => {
    const board = new BackgroundJobBoard();
    board.recordLaunch({
      parentSessionID: 'parent-1',
      taskID: 'task-1',
      agent: 'explorer',
      description: 'map files',
      objective: 'find relevant code',
      source: 'task',
    });

    board.removeForParent('parent-1');

    expect(board.get('task-1')).toBeUndefined();
    expect(board.resolve('parent-1', 'exp-1')).toBeUndefined();
  });
});
