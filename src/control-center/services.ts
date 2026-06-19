import {
  type CommandRunner,
  type ControlCenterPaths,
  defaultCommandRunner,
  getDefaultControlCenterPaths,
  ReportRepository,
  SchedulerHealthAdapter,
  SqliteTaskRunRepository,
  TaskDefinitionFileRepository,
} from './adapters';
import {
  type ControlCenterDashboard,
  createControlCenterDashboard,
} from './dashboard';
import { summarizeTask, validateRecurringTaskDraft } from './domain';
import type {
  ControlCenterSnapshot,
  HealthService,
  RecurringTaskDraft,
  RecurringTaskUpdate,
  SchedulerHealth,
  StreamEvent,
  StreamService,
  TaskDefinition,
  TaskDetail,
  TaskRun,
  TaskService,
  ValidationResult,
} from './types';

export interface ControlCenterServiceOptions {
  paths?: ControlCenterPaths;
  configDir?: string;
  commandRunner?: CommandRunner;
  now?: () => Date;
}

export interface ControlCenterServices {
  paths: ControlCenterPaths;
  tasks: TaskService;
  streams: StreamService;
  health: HealthService;
  dashboard: ControlCenterDashboard;
  snapshot(selectedTaskName?: string): Promise<ControlCenterSnapshot>;
}

export function createControlCenterServices(
  options: ControlCenterServiceOptions = {},
): ControlCenterServices {
  const paths =
    options.paths ?? getDefaultControlCenterPaths(options.configDir);
  const definitions = new TaskDefinitionFileRepository(paths);
  const runs = new SqliteTaskRunRepository(paths.tasksDbPath);
  const reports = new ReportRepository(paths);
  const scheduler = new SchedulerHealthAdapter(
    paths,
    options.commandRunner ?? defaultCommandRunner,
  );
  const now = options.now ?? (() => new Date());
  const taskService = new LocalTaskService(definitions, runs, reports, now);
  const streamService = new LocalStreamService(scheduler, reports);
  const healthService = new LocalHealthService(definitions, runs, scheduler);
  const dashboard = createControlCenterDashboard(
    {
      tasks: taskService,
      streams: streamService,
      health: healthService,
    },
    { now },
  );

  return {
    paths,
    tasks: taskService,
    streams: streamService,
    health: healthService,
    dashboard,
    async snapshot(selectedTaskName?: string) {
      return dashboard.snapshot(selectedTaskName);
    },
  };
}

class LocalTaskService implements TaskService {
  constructor(
    private readonly definitions: TaskDefinitionFileRepository,
    private readonly runs: SqliteTaskRunRepository,
    private readonly reports: ReportRepository,
    private readonly now: () => Date,
  ) {}

  async listTasks() {
    const definitions = this.definitions.listDefinitions();
    const runs = this.runs.listRuns(200);
    const latestRuns = latestRunByTask(runs);
    const names = new Set([
      ...definitions.map((task) => task.name),
      ...runs.map((run) => run.taskName),
    ]);

    return [...names].sort().map((name) =>
      summarizeTask({
        name,
        definition: definitions.find((task) => task.name === name),
        latestRun: latestRuns.get(name),
        now: this.now(),
      }),
    );
  }

  async getTask(taskName: string): Promise<TaskDetail> {
    const summaries = await this.listTasks();
    const summary =
      summaries.find((task) => task.name === taskName) ??
      summarizeTask({ name: taskName, now: this.now() });
    return {
      ...summary,
      runs: this.runs.listRunsForTask(taskName, 25),
      report: this.reports.readReport(taskName),
    };
  }

  async listRuns(taskName: string, limit = 25): Promise<TaskRun[]> {
    return this.runs.listRunsForTask(taskName, limit);
  }

  validateRecurringTask(input: RecurringTaskDraft): ValidationResult {
    return validateRecurringTaskDraft(input);
  }

  async createRecurringTask(
    input: RecurringTaskDraft,
  ): Promise<TaskDefinition> {
    return this.definitions.createDefinition(input);
  }

  async updateRecurringTask(
    input: RecurringTaskUpdate,
  ): Promise<TaskDefinition> {
    const existing = this.definitions.readDefinition(input.name);
    const merged: RecurringTaskDraft & { filePath: string } = {
      name: input.name,
      description: input.description ?? existing?.description ?? input.name,
      schedule: input.schedule ?? existing?.schedule ?? '0 9 * * *',
      cwd: input.cwd ?? existing?.cwd ?? process.cwd(),
      prompt: input.prompt ?? existing?.prompt ?? '',
      enabled: input.enabled ?? existing?.enabled ?? false,
      sessionName: input.sessionName ?? existing?.sessionName,
      permissions: input.permissions ?? existing?.permissions,
      filePath: input.filePath,
    };
    return this.definitions.updateDefinition(merged);
  }
}

class LocalHealthService implements HealthService {
  constructor(
    private readonly definitions: TaskDefinitionFileRepository,
    private readonly runs: SqliteTaskRunRepository,
    private readonly scheduler: SchedulerHealthAdapter,
  ) {}

  async getSchedulerHealth(): Promise<SchedulerHealth> {
    return this.scheduler.getHealth(
      this.definitions.listDefinitions(),
      this.runs.listRuns(100),
    );
  }

  async *watchSchedulerHealth(): AsyncIterable<SchedulerHealth> {
    yield await this.getSchedulerHealth();
  }
}

class LocalStreamService implements StreamService {
  constructor(
    private readonly scheduler: SchedulerHealthAdapter,
    private readonly reports: ReportRepository,
  ) {}

  async *streamSchedulerLogs(): AsyncIterable<StreamEvent> {
    for (const event of await this.listRecentSchedulerEvents()) yield event;
  }

  async *streamTaskSession(sessionId: string): AsyncIterable<StreamEvent> {
    yield {
      source: 'session',
      severity: 'info',
      sessionId,
      text: `Open with: opencode -s ${sessionId}`,
    };
  }

  async *streamReport(path: string): AsyncIterable<StreamEvent> {
    const taskName = path.endsWith('.md')
      ? path.split('/').pop()?.replace(/\.md$/, '')
      : path;
    const report = taskName ? this.reports.readReport(taskName) : undefined;
    if (!report) return;
    for (const line of report.content
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-50)) {
      yield { source: 'report', severity: 'info', text: line };
    }
  }

  async listRecentSchedulerEvents(limit = 50): Promise<StreamEvent[]> {
    return this.scheduler.readSchedulerEvents(limit);
  }
}

function latestRunByTask(runs: TaskRun[]): Map<string, TaskRun> {
  const latest = new Map<string, TaskRun>();
  for (const run of runs) {
    if (!latest.has(run.taskName)) latest.set(run.taskName, run);
  }
  return latest;
}
