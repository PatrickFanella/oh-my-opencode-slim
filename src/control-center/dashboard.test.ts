import { describe, expect, test } from 'bun:test';
import { createControlCenterDashboard } from './dashboard';
import type {
  HealthService,
  StreamService,
  TaskDetail,
  TaskService,
  TaskSummary,
} from './types';

const task: TaskSummary = {
  name: 'observe',
  badges: ['enabled'],
  warnings: [],
};

const otherTask: TaskSummary = {
  name: 'audit',
  badges: ['enabled'],
  warnings: [],
};

const detail: TaskDetail = {
  ...task,
  runs: [
    {
      id: 'run-1',
      taskName: 'observe',
      status: 'completed',
      raw: {},
    },
  ],
  report: {
    path: '/tmp/observe.md',
    content: 'done',
  },
};

const otherDetail: TaskDetail = {
  ...otherTask,
  runs: [],
};

describe('control-center dashboard', () => {
  test('builds a stable snapshot from renderer-neutral services', async () => {
    const dashboard = createControlCenterDashboard(fakeServices(), {
      now: () => new Date('2026-01-02T03:04:05.000Z'),
    });

    const snapshot = await dashboard.snapshot('observe');

    expect(snapshot.tasks).toEqual([task]);
    expect(snapshot.selectedTask?.name).toBe('observe');
    expect(snapshot.selectedTask?.runs).toHaveLength(1);
    expect(snapshot.selectedTask?.report?.content).toBe('done');
    expect(snapshot.health.status).toBe('ok');
    expect(snapshot.schedulerEvents).toHaveLength(1);
    expect(snapshot.generatedAt).toBe('2026-01-02T03:04:05.000Z');
  });

  test('builds a snapshot without a selected task when no tasks exist', async () => {
    const dashboard = createControlCenterDashboard(fakeServices({ tasks: [] }));

    const snapshot = await dashboard.snapshot();

    expect(snapshot.tasks).toEqual([]);
    expect(snapshot.selectedTask).toBeUndefined();
  });

  test('forwards selected task name instead of always choosing first task', async () => {
    const dashboard = createControlCenterDashboard(
      fakeServices({ tasks: [task, otherTask] }),
    );

    const snapshot = await dashboard.snapshot('audit');

    expect(snapshot.tasks.map((entry) => entry.name)).toEqual([
      'observe',
      'audit',
    ]);
    expect(snapshot.selectedTask?.name).toBe('audit');
  });

  test('exposes task list and detail reads directly', async () => {
    const dashboard = createControlCenterDashboard(fakeServices());

    expect(await dashboard.listTasks()).toEqual([task]);
    expect(await dashboard.getTask('observe')).toEqual(detail);
  });
});

function fakeServices(options: { tasks?: TaskSummary[] } = {}): {
  tasks: TaskService;
  streams: StreamService;
  health: HealthService;
} {
  const tasks = options.tasks ?? [task];
  return {
    tasks: {
      async listTasks() {
        return tasks;
      },
      async getTask(taskName: string) {
        if (taskName === otherDetail.name) return otherDetail;
        if (taskName !== detail.name) throw new Error(`unexpected ${taskName}`);
        return detail;
      },
      async listRuns() {
        return [];
      },
      validateRecurringTask() {
        return { ok: true, diagnostics: [] };
      },
      async createRecurringTask() {
        throw new Error('not used');
      },
      async updateRecurringTask() {
        throw new Error('not used');
      },
    },
    streams: {
      async *streamSchedulerLogs() {},
      async *streamTaskSession() {},
      async *streamReport() {},
      async listRecentSchedulerEvents() {
        return [{ source: 'scheduler', severity: 'info', text: 'tick' }];
      },
    },
    health: {
      async getSchedulerHealth() {
        return {
          status: 'ok',
          summary: 'ok',
          database: { exists: true, path: '/tmp/.tasks.db' },
          tasks: { total: 1, enabled: 1, invalid: 0 },
          recentFailureCount: 0,
          diagnostics: [],
          checkedAt: '2026-01-01T00:00:00.000Z',
        };
      },
      async *watchSchedulerHealth() {},
    },
  };
}
