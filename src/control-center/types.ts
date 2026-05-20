export type DiagnosticLevel = 'info' | 'warning' | 'error';

export interface ValidationDiagnostic {
  level: DiagnosticLevel;
  message: string;
  path?: string;
  line?: number;
}

export interface ValidationResult {
  ok: boolean;
  diagnostics: ValidationDiagnostic[];
}

export type TaskRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown';

export interface TaskDefinition {
  name: string;
  filePath: string;
  description?: string;
  schedule?: string;
  enabled: boolean;
  cwd?: string;
  sessionName?: string;
  permissions?: unknown;
  prompt: string;
  frontmatter: Record<string, unknown>;
  diagnostics: ValidationDiagnostic[];
}

export interface RecurringTaskDraft {
  name: string;
  description: string;
  schedule: string;
  cwd: string;
  prompt: string;
  enabled?: boolean;
  sessionName?: string;
  permissions?: unknown;
}

export interface RecurringTaskUpdate extends Partial<RecurringTaskDraft> {
  name: string;
  filePath: string;
}

export interface TaskRun {
  id: string;
  taskName: string;
  status: TaskRunStatus;
  startedAt?: string;
  completedAt?: string;
  sessionId?: string;
  error?: string;
  pid?: number;
  raw: Record<string, unknown>;
}

export interface ReportSnapshot {
  path: string;
  updatedAt?: string;
  content: string;
}

export interface TaskSummary {
  name: string;
  definition?: TaskDefinition;
  latestRun?: TaskRun;
  nextRunAt?: string;
  badges: string[];
  warnings: string[];
}

export interface TaskDetail extends TaskSummary {
  runs: TaskRun[];
  report?: ReportSnapshot;
}

export interface SchedulerHealth {
  status: 'ok' | 'warning' | 'error' | 'unknown';
  summary: string;
  timer?: {
    enabled?: boolean;
    active?: boolean;
  };
  service?: {
    active?: boolean;
    result?: string;
  };
  database: {
    exists: boolean;
    path: string;
    sizeBytes?: number;
  };
  tasks: {
    total: number;
    enabled: number;
    invalid: number;
  };
  recentFailureCount: number;
  diagnostics: ValidationDiagnostic[];
  checkedAt: string;
}

export type StreamEventSource = 'scheduler' | 'session' | 'report' | 'database';

export interface StreamEvent {
  source: StreamEventSource;
  timestamp?: string;
  severity: DiagnosticLevel;
  taskName?: string;
  sessionId?: string;
  text: string;
}

export interface TaskService {
  listTasks(): Promise<TaskSummary[]>;
  getTask(taskName: string): Promise<TaskDetail>;
  listRuns(taskName: string, limit?: number): Promise<TaskRun[]>;
  validateRecurringTask(input: RecurringTaskDraft): ValidationResult;
  createRecurringTask(input: RecurringTaskDraft): Promise<TaskDefinition>;
  updateRecurringTask(input: RecurringTaskUpdate): Promise<TaskDefinition>;
}

export interface StreamService {
  streamSchedulerLogs(): AsyncIterable<StreamEvent>;
  streamTaskSession(sessionId: string): AsyncIterable<StreamEvent>;
  streamReport(path: string): AsyncIterable<StreamEvent>;
  listRecentSchedulerEvents(limit?: number): Promise<StreamEvent[]>;
}

export interface HealthService {
  getSchedulerHealth(): Promise<SchedulerHealth>;
  watchSchedulerHealth(): AsyncIterable<SchedulerHealth>;
}

export interface ControlCenterSnapshot {
  tasks: TaskSummary[];
  selectedTask?: TaskDetail;
  health: SchedulerHealth;
  schedulerEvents: StreamEvent[];
  generatedAt: string;
}
