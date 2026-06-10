import { describe, expect, test } from 'bun:test';
import {
  createSchedulerStatusSnapshot,
  isKnownSchedulerWorkerNoise,
} from './scheduler-status';
import type { SchedulerHealth, TaskSummary } from './types';

const baseHealth: SchedulerHealth = {
  status: 'ok',
  summary: 'scheduler ok',
  timer: { enabled: true, active: true },
  service: { active: true, result: 'active' },
  database: { exists: true, path: '/tmp/.tasks.db', sizeBytes: 10 },
  tasks: { total: 1, enabled: 1, invalid: 0 },
  recentFailureCount: 0,
  diagnostics: [],
  checkedAt: '2026-05-20T20:00:00.000Z',
};

const baseTask: TaskSummary = {
  name: 'observe',
  definition: {
    name: 'observe',
    filePath: '/tmp/observe.md',
    description: 'Observe',
    schedule: '22,52 * * * *',
    enabled: true,
    cwd: '/tmp',
    prompt: 'Prompt',
    frontmatter: {},
    diagnostics: [],
  },
  latestRun: {
    id: 'run-1',
    taskName: 'observe',
    status: 'completed',
    startedAt: '2026-05-20T19:52:44.067Z',
    completedAt: '2026-05-20T19:54:40.748Z',
    raw: {},
  },
  nextRunAt: '2026-05-20T20:22:00.000Z',
  badges: ['enabled', 'completed'],
  warnings: [],
};

describe('scheduler-status', () => {
  test('keeps known worker-continuation messages as notices without degrading health', () => {
    const snapshot = createSchedulerStatusSnapshot([
      {
        host: 'nuc',
        generatedAt: '2026-05-20T20:00:00.000Z',
        health: baseHealth,
        tasks: [baseTask],
        notices: [
          'opencode-tasks.service: Found left-over process 123 (opencode) in control group while starting unit. Ignoring.',
        ],
      },
    ]);

    expect(snapshot.mode).toBe('read-only');
    expect(snapshot.hosts).toHaveLength(1);
    expect(snapshot.hosts[0]?.status).toBe('healthy');
    expect(snapshot.hosts[0]?.counts.failedRecentRuns).toBe(0);
    expect(snapshot.hosts[0]?.tasks[0]?.risk).toBe('ok');
    expect(snapshot.hosts[0]?.notices).toContain(
      'opencode-tasks.service: Found left-over process 123 (opencode) in control group while starting unit. Ignoring.',
    );
  });

  test('marks a host degraded when a recent task failed', () => {
    const snapshot = createSchedulerStatusSnapshot([
      {
        host: 'nuc',
        generatedAt: '2026-05-20T20:00:00.000Z',
        health: baseHealth,
        tasks: [
          {
            ...baseTask,
            latestRun: {
              ...baseTask.latestRun,
              status: 'failed',
            },
          },
        ],
      },
    ]);

    expect(snapshot.hosts[0]?.status).toBe('degraded');
    expect(snapshot.hosts[0]?.counts.failedRecentRuns).toBe(1);
    expect(snapshot.hosts[0]?.tasks[0]?.risk).toBe('alert');
  });

  test('marks a host unavailable when scheduler health is unavailable', () => {
    const snapshot = createSchedulerStatusSnapshot([
      {
        host: 'nuc',
        generatedAt: '2026-05-20T20:00:00.000Z',
        health: {
          ...baseHealth,
          database: { ...baseHealth.database, exists: false },
        },
        tasks: [baseTask],
      },
    ]);

    expect(snapshot.hosts[0]?.status).toBe('unavailable');
  });

  test('detects known worker-continuation noise', () => {
    expect(
      isKnownSchedulerWorkerNoise(
        'opencode-tasks.service: Unit process 123 (chrome-devtools) remains running after unit stopped.',
      ),
    ).toBe(true);
    expect(isKnownSchedulerWorkerNoise('task run failed with exit 1')).toBe(
      false,
    );
  });
});
