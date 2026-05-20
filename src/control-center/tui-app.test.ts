import { describe, expect, test } from 'bun:test';
import type { CliRenderer } from '@opentui/core';
import type { ControlCenterServices } from './services';
import { runControlCenterTui } from './tui-app';
import type { ControlCenterSnapshot } from './types';

function createSnapshot(): ControlCenterSnapshot {
  return {
    generatedAt: '2026-01-01T00:00:00.000Z',
    health: {
      status: 'ok',
      summary: 'ok',
      database: { exists: false, path: '/tmp/.tasks.db' },
      tasks: { total: 0, enabled: 0, invalid: 0 },
      recentFailureCount: 0,
      diagnostics: [],
      checkedAt: '2026-01-01T00:00:00.000Z',
    },
    schedulerEvents: [],
    tasks: [],
  };
}

function createServices(): ControlCenterServices {
  const snapshot = createSnapshot();
  return {
    paths: {
      configDir: '/tmp/opencode',
      tasksDir: '/tmp/opencode/tasks',
      taskReportsDir: '/tmp/opencode/task-reports',
      tasksDbPath: '/tmp/opencode/.tasks.db',
    },
    tasks: {
      async listTasks() {
        return [];
      },
      async getTask() {
        throw new Error('No tasks');
      },
      async listRuns() {
        return [];
      },
      validateRecurringTask() {
        return { ok: true, diagnostics: [] };
      },
      async createRecurringTask() {
        throw new Error('Not used');
      },
      async updateRecurringTask() {
        throw new Error('Not used');
      },
    },
    streams: {
      async *streamSchedulerLogs() {},
      async *streamTaskSession() {},
      async *streamReport() {},
      async listRecentSchedulerEvents() {
        return [];
      },
    },
    health: {
      async getSchedulerHealth() {
        return snapshot.health;
      },
      async *watchSchedulerHealth() {
        yield snapshot.health;
      },
    },
    async snapshot() {
      return snapshot;
    },
  };
}

function createRenderer(): CliRenderer & { emitDestroy(): void } {
  const destroyHandlers: Array<() => void> = [];
  const renderer = {
    width: 100,
    height: 24,
    root: { add() {} },
    keyInput: { on() {} },
    requestRender() {},
    on(event: string, handler: () => void) {
      if (event === 'destroy') destroyHandlers.push(handler);
      return renderer;
    },
    emitDestroy() {
      for (const handler of destroyHandlers) handler();
    },
  };

  return renderer as unknown as CliRenderer & { emitDestroy(): void };
}

describe('control-center TUI app lifecycle', () => {
  test('stays pending until the renderer is destroyed', async () => {
    const renderer = createRenderer();
    let settled = false;
    const promise = runControlCenterTui({
      renderer,
      services: createServices(),
      createScreen: (_renderer, content) => ({ content }),
      refreshIntervalMs: 60_000,
    }).then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    renderer.emitDestroy();
    await promise;
    expect(settled).toBe(true);
  });
});
