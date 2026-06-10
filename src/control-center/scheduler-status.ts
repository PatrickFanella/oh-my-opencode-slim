import type { SchedulerHealth, TaskRunStatus, TaskSummary } from './types';

export type SchedulerHostStatus = 'healthy' | 'degraded' | 'unavailable';

export type SchedulerTaskLastStatus =
  | 'completed'
  | 'running'
  | 'failed'
  | 'never'
  | 'unknown';

export type SchedulerRisk = 'ok' | 'watch' | 'alert';

export interface SchedulerStatusInput {
  host: string;
  generatedAt: string;
  health: SchedulerHealth;
  tasks: readonly TaskSummary[];
  notices?: readonly string[];
}

export interface SchedulerTaskStatusSummary {
  name: string;
  enabled: boolean;
  schedule: string;
  lastStatus: SchedulerTaskLastStatus;
  lastStartedAt?: string;
  lastCompletedAt?: string;
  nextRunAt?: string;
  risk: SchedulerRisk;
  message: string;
}

export interface SchedulerHostSummary {
  host: string;
  status: SchedulerHostStatus;
  generatedAt: string;
  scheduler: {
    status: SchedulerHealth['status'];
    summary: string;
    timerEnabled: boolean;
    timerActive: boolean;
    serviceActive: boolean;
    serviceResult?: string;
    databaseExists: boolean;
    databasePath: string;
    databaseSizeBytes?: number;
    checkedAt: string;
  };
  counts: {
    enabledTasks: number;
    disabledTasks: number;
    failedRecentRuns: number;
    stuckRuns: number;
    invalidTasks: number;
  };
  tasks: SchedulerTaskStatusSummary[];
  notices: string[];
}

export interface SchedulerStatusSnapshot {
  generatedAt: string;
  mode: 'read-only';
  hosts: SchedulerHostSummary[];
}

const KNOWN_WORKER_NAMES = [
  'bun',
  'chrome-devtools',
  'MainThread',
  'npm exec @playw',
  'npm exec chrome',
  'opencode',
  'sp-mcp',
];

export function createSchedulerStatusSnapshot(
  inputs: readonly SchedulerStatusInput[],
): SchedulerStatusSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    mode: 'read-only',
    hosts: inputs.map(toHostSummary),
  };
}

export function isKnownSchedulerWorkerNoise(message: string): boolean {
  const hasSystemdNoise =
    message.includes('Found left-over process') ||
    message.includes('remains running after unit stopped') ||
    message.includes('Unit process');

  return (
    hasSystemdNoise && KNOWN_WORKER_NAMES.some((name) => message.includes(name))
  );
}

function toHostSummary(input: SchedulerStatusInput): SchedulerHostSummary {
  const tasks = input.tasks.map(toTaskSummary);
  const failedRecentRuns = tasks.filter(
    (task) => task.lastStatus === 'failed',
  ).length;
  const stuckRuns = tasks.filter((task) => task.risk === 'watch').length;
  const invalidTasks = input.health.tasks.invalid;
  const unavailable = isSchedulerUnavailable(input.health);
  const status: SchedulerHostStatus = unavailable
    ? 'unavailable'
    : input.health.status === 'warning' || failedRecentRuns > 0 || stuckRuns > 0
      ? 'degraded'
      : 'healthy';

  return {
    host: input.host,
    status,
    generatedAt: input.generatedAt,
    scheduler: {
      status: input.health.status,
      summary: input.health.summary,
      timerEnabled: input.health.timer?.enabled ?? false,
      timerActive: input.health.timer?.active ?? false,
      serviceActive: input.health.service?.active ?? false,
      serviceResult: input.health.service?.result,
      databaseExists: input.health.database.exists,
      databasePath: input.health.database.path,
      databaseSizeBytes: input.health.database.sizeBytes,
      checkedAt: input.health.checkedAt,
    },
    counts: {
      enabledTasks: input.health.tasks.enabled,
      disabledTasks: Math.max(
        0,
        input.health.tasks.total - input.health.tasks.enabled,
      ),
      failedRecentRuns,
      stuckRuns,
      invalidTasks,
    },
    tasks,
    notices: collectNotices(input),
  };
}

function isSchedulerUnavailable(health: SchedulerHealth): boolean {
  return (
    health.status === 'error' ||
    health.status === 'unknown' ||
    !health.database.exists ||
    health.timer?.active === false ||
    health.service?.active === false
  );
}

function collectNotices(input: SchedulerStatusInput): string[] {
  const notices = new Set<string>();
  for (const notice of input.notices ?? []) {
    if (notice.trim()) notices.add(notice);
  }
  for (const diagnostic of input.health.diagnostics) {
    if (diagnostic.message.trim()) notices.add(diagnostic.message);
  }
  for (const task of input.tasks) {
    for (const warning of task.warnings) {
      if (warning.trim()) notices.add(warning);
    }
  }
  return [...notices];
}

function toTaskSummary(task: TaskSummary): SchedulerTaskStatusSummary {
  const lastStatus = toSchedulerTaskLastStatus(task.latestRun?.status);
  const risk = taskRisk(lastStatus);
  return {
    name: task.name,
    enabled: task.definition?.enabled ?? false,
    schedule: task.definition?.schedule ?? 'unknown',
    lastStatus,
    lastStartedAt: task.latestRun?.startedAt,
    lastCompletedAt: task.latestRun?.completedAt,
    nextRunAt: task.nextRunAt,
    risk,
    message: taskMessage(task.name, lastStatus, risk),
  };
}

function toSchedulerTaskLastStatus(
  status: TaskRunStatus | undefined,
): SchedulerTaskLastStatus {
  if (!status) return 'never';
  if (status === 'completed' || status === 'running' || status === 'failed') {
    return status;
  }
  return 'unknown';
}

function taskRisk(status: SchedulerTaskLastStatus): SchedulerRisk {
  if (status === 'failed') return 'alert';
  if (status === 'running' || status === 'unknown') return 'watch';
  return 'ok';
}

function taskMessage(
  name: string,
  status: SchedulerTaskLastStatus,
  risk: SchedulerRisk,
): string {
  if (risk === 'alert') return `${name} failed in recent runs.`;
  if (risk === 'watch') return `${name} is still running or uncertain.`;
  if (status === 'never') return `${name} has not run yet.`;
  return `${name} is healthy.`;
}
