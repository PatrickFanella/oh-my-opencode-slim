import type { ControlCenterSnapshot } from '../types';

export const fixtureSnapshot: ControlCenterSnapshot = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  health: {
    status: 'ok',
    summary: 'scheduler ok',
    database: {
      exists: true,
      path: '/tmp/opencode/.tasks.db',
      sizeBytes: 2048,
    },
    tasks: {
      total: 2,
      enabled: 2,
      invalid: 0,
    },
    recentFailureCount: 1,
    diagnostics: [],
    checkedAt: '2026-01-01T00:00:00.000Z',
  },
  schedulerEvents: [
    {
      source: 'scheduler',
      severity: 'info',
      text: 'timer fired',
    },
  ],
  selectedTask: {
    name: 'observe',
    definition: {
      name: 'observe',
      filePath: '/tmp/opencode/tasks/observe.md',
      description: 'Observe the system',
      schedule: '0 9 * * *',
      enabled: true,
      cwd: '/tmp/project',
      sessionName: 'observe',
      permissions: { bash: { '*': 'allow' } },
      prompt: 'Observe and report.',
      frontmatter: {},
      diagnostics: [],
    },
    latestRun: {
      id: 'run-1',
      taskName: 'observe',
      status: 'completed',
      startedAt: '2026-01-01T00:00:00.000Z',
      sessionId: 'sess-1',
      raw: {},
    },
    nextRunAt: '2026-01-02T09:00:00.000Z',
    badges: ['enabled', 'completed'],
    warnings: [],
    runs: [
      {
        id: 'run-1',
        taskName: 'observe',
        status: 'completed',
        startedAt: '2026-01-01T00:00:00.000Z',
        sessionId: 'sess-1',
        raw: {},
      },
    ],
    report: {
      path: '/tmp/opencode/task-reports/observe.md',
      content: 'report line one\nreport line two',
    },
  },
  tasks: [
    {
      name: 'observe',
      latestRun: {
        id: 'run-1',
        taskName: 'observe',
        status: 'completed',
        startedAt: '2026-01-01T00:00:00.000Z',
        sessionId: 'sess-1',
        raw: {},
      },
      nextRunAt: '2026-01-02T09:00:00.000Z',
      badges: ['enabled', 'completed'],
      warnings: [],
    },
    {
      name: 'daily-maintenance',
      latestRun: {
        id: 'run-2',
        taskName: 'daily-maintenance',
        status: 'failed',
        startedAt: '2026-01-01T01:00:00.000Z',
        error: 'boom',
        raw: {},
      },
      badges: ['enabled', 'failed'],
      warnings: ['Latest run failed'],
    },
  ],
};
