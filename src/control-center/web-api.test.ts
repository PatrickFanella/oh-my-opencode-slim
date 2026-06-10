import { describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ControlCenterServices } from './services';
import type {
  ControlCenterSnapshot,
  RecurringTaskDraft,
  RecurringTaskUpdate,
  SchedulerHealth,
  StreamEvent,
  TaskDetail,
  TaskRun,
  TaskSummary,
} from './types';
import { createControlCenterWebApi } from './web-api';

const run: TaskRun = {
  id: 'run-1',
  taskName: 'observe',
  status: 'completed',
  startedAt: '2026-01-01T00:00:00.000Z',
  sessionId: 'sess-1',
  raw: {},
};

const task: TaskSummary = {
  name: 'observe',
  latestRun: run,
  badges: ['enabled', 'completed'],
  warnings: [],
};

const detail: TaskDetail = {
  ...task,
  runs: [run],
  report: {
    path: '/tmp/report.md',
    content: 'report line',
  },
};

const health: SchedulerHealth = {
  status: 'ok',
  summary: 'scheduler ok',
  database: { exists: true, path: '/tmp/.tasks.db', sizeBytes: 10 },
  tasks: { total: 1, enabled: 1, invalid: 0 },
  recentFailureCount: 0,
  diagnostics: [],
  checkedAt: '2026-01-01T00:00:00.000Z',
};

const schedulerEvent: StreamEvent = {
  source: 'scheduler',
  severity: 'info',
  text: 'timer fired',
};

const snapshot: ControlCenterSnapshot = {
  tasks: [task],
  selectedTask: detail,
  health,
  schedulerEvents: [schedulerEvent],
  generatedAt: '2026-01-01T00:00:00.000Z',
};

describe('control-center web API', () => {
  test('returns a selected snapshot', async () => {
    const api = createControlCenterWebApi({ services: fakeServices() });

    const response = await api.fetch(
      new Request('http://127.0.0.1/api/snapshot?selectedTask=observe'),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      selectedTask: { name: 'observe' },
      health: { status: 'ok' },
    });
  });

  test('returns scheduler status snapshot', async () => {
    const api = createControlCenterWebApi({ services: fakeServices() });

    const response = await api.fetch(
      new Request('http://127.0.0.1/api/scheduler-status'),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe('read-only');
    expect(body.hosts[0]?.status).toBe('healthy');
    expect(body.hosts[0]?.tasks[0]?.name).toBe('observe');
  });

  test('serves task detail and run history routes', async () => {
    const api = createControlCenterWebApi({ services: fakeServices() });

    const detailResponse = await api.fetch(
      new Request('http://127.0.0.1/api/tasks/observe'),
    );
    const runsResponse = await api.fetch(
      new Request('http://127.0.0.1/api/tasks/observe/runs?limit=5'),
    );

    expect(await detailResponse.json()).toMatchObject({ name: 'observe' });
    expect(await runsResponse.json()).toMatchObject([{ id: 'run-1' }]);
  });

  test('rejects mutation requests', async () => {
    const api = createControlCenterWebApi({ services: fakeServices() });

    const response = await api.fetch(
      new Request('http://127.0.0.1/api/tasks', { method: 'POST' }),
    );

    expect(response.status).toBe(405);
    expect(await response.json()).toMatchObject({
      error: 'Control center API is read-only',
    });
  });

  test('rejects unsafe task names before report lookup', async () => {
    const api = createControlCenterWebApi({ services: fakeServices() });

    const response = await api.fetch(
      new Request('http://127.0.0.1/api/tasks/..%2Fsecret'),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: 'Invalid task name',
    });
  });

  test('formats scheduler events as SSE', async () => {
    const api = createControlCenterWebApi({ services: fakeServices() });

    const response = await api.fetch(
      new Request('http://127.0.0.1/api/events/scheduler?once=true'),
    );

    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(await response.text()).toContain('data: {"source":"scheduler"');
  });

  test('confines static asset reads to the asset root', async () => {
    const root = join(
      '/tmp',
      `blacktower-web-assets-${Date.now()}-${Math.random()}`,
    );
    const assetRoot = join(root, 'dist');
    mkdirSync(assetRoot, { recursive: true });
    writeFileSync(join(assetRoot, 'index.html'), '<div>safe</div>');
    writeFileSync(join(root, 'dist-secret.md'), 'secret');

    try {
      const api = createControlCenterWebApi({
        assetRoot,
        services: fakeServices(),
      });
      const response = await api.fetch(
        new Request('http://127.0.0.1/%2E%2E%2Fdist-secret.md'),
      );

      expect(response.status).toBe(403);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

function fakeServices(): ControlCenterServices {
  return {
    paths: {
      configDir: '/tmp/opencode',
      tasksDir: '/tmp/opencode/tasks',
      taskReportsDir: '/tmp/opencode/task-reports',
      tasksDbPath: '/tmp/opencode/.tasks.db',
    },
    tasks: {
      async listTasks() {
        return [task];
      },
      async getTask() {
        return detail;
      },
      async listRuns() {
        return [run];
      },
      validateRecurringTask() {
        return { ok: true, diagnostics: [] };
      },
      async createRecurringTask(_input: RecurringTaskDraft) {
        throw new Error('not exposed');
      },
      async updateRecurringTask(_input: RecurringTaskUpdate) {
        throw new Error('not exposed');
      },
    },
    streams: {
      async *streamSchedulerLogs() {
        yield schedulerEvent;
      },
      async *streamTaskSession() {},
      async *streamReport() {},
      async listRecentSchedulerEvents() {
        return [schedulerEvent];
      },
    },
    health: {
      async getSchedulerHealth() {
        return health;
      },
      async *watchSchedulerHealth() {
        yield health;
      },
    },
    async snapshot() {
      return snapshot;
    },
  };
}
