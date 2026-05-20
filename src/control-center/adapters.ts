import { Database } from 'bun:sqlite';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, platform } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import {
  normalizeRunStatus,
  parseRecurringTaskMarkdown,
  renderRecurringTaskDraft,
  validateRecurringTaskDraft,
} from './domain';
import type {
  RecurringTaskDraft,
  ReportSnapshot,
  SchedulerHealth,
  StreamEvent,
  TaskDefinition,
  TaskRun,
  ValidationDiagnostic,
} from './types';

export interface ControlCenterPaths {
  configDir: string;
  tasksDir: string;
  taskReportsDir: string;
  tasksDbPath: string;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (
  command: string,
  args: readonly string[],
  timeoutMs?: number,
) => Promise<CommandResult>;

const RUN_TABLE_HINTS = [
  'run',
  'runs',
  'execution',
  'executions',
  'job',
  'jobs',
];
const TASK_NAME_COLUMNS = [
  'task_name',
  'taskName',
  'task',
  'name',
  'description',
  'session_name',
];
const STATUS_COLUMNS = ['status', 'state', 'result', 'outcome'];
const START_COLUMNS = [
  'started_at',
  'startedAt',
  'start_time',
  'created_at',
  'createdAt',
  'scheduled_at',
];
const END_COLUMNS = [
  'completed_at',
  'completedAt',
  'ended_at',
  'end_time',
  'updated_at',
];
const SESSION_COLUMNS = [
  'session_id',
  'sessionId',
  'session',
  'opencode_session_id',
];
const ERROR_COLUMNS = ['error', 'error_message', 'message', 'stderr'];

export function getDefaultControlCenterPaths(
  configDir = process.env.OPENCODE_CONFIG_DIR?.trim() ||
    join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'opencode'),
): ControlCenterPaths {
  return {
    configDir,
    tasksDir: join(configDir, 'tasks'),
    taskReportsDir: join(configDir, 'task-reports'),
    tasksDbPath: join(configDir, '.tasks.db'),
  };
}

export class TaskDefinitionFileRepository {
  constructor(private readonly paths: ControlCenterPaths) {}

  listDefinitions(): TaskDefinition[] {
    if (!existsSync(this.paths.tasksDir)) return [];
    return readdirSync(this.paths.tasksDir)
      .filter((entry) => entry.endsWith('.md'))
      .sort()
      .map((entry) => {
        const filePath = join(this.paths.tasksDir, entry);
        return parseRecurringTaskMarkdown(
          filePath,
          readFileSync(filePath, 'utf-8'),
        );
      });
  }

  readDefinition(taskName: string): TaskDefinition | undefined {
    return this.listDefinitions().find((task) => task.name === taskName);
  }

  createDefinition(input: RecurringTaskDraft): TaskDefinition {
    const validation = validateRecurringTaskDraft(input);
    if (!validation.ok)
      throw new Error(formatDiagnostics(validation.diagnostics));
    mkdirSync(this.paths.tasksDir, { recursive: true });
    const filePath = join(this.paths.tasksDir, `${input.name}.md`);
    if (existsSync(filePath))
      throw new Error(`Task already exists: ${input.name}`);
    writeFileSync(filePath, renderRecurringTaskDraft(input));
    return parseRecurringTaskMarkdown(
      filePath,
      readFileSync(filePath, 'utf-8'),
    );
  }

  updateDefinition(
    input: RecurringTaskDraft & { filePath: string },
  ): TaskDefinition {
    const validation = validateRecurringTaskDraft(input);
    if (!validation.ok)
      throw new Error(formatDiagnostics(validation.diagnostics));
    writeFileSync(input.filePath, renderRecurringTaskDraft(input));
    return parseRecurringTaskMarkdown(
      input.filePath,
      readFileSync(input.filePath, 'utf-8'),
    );
  }
}

function formatDiagnostics(diagnostics: ValidationDiagnostic[]): string {
  return diagnostics.map((entry) => entry.message).join('; ');
}

export class SqliteTaskRunRepository {
  constructor(private readonly dbPath: string) {}

  listRuns(limit = 100): TaskRun[] {
    if (!existsSync(this.dbPath)) return [];
    const db = new Database(this.dbPath, { readonly: true });
    try {
      const table = findRunTable(db);
      if (!table) return [];
      const boundedLimit = Math.max(1, Math.min(limit, 500));
      const orderColumn = findFirstColumn(table.columns, [
        ...START_COLUMNS,
        ...END_COLUMNS,
        'id',
      ]);
      const sql = [
        `select * from ${quoteIdentifier(table.name)}`,
        orderColumn ? `order by ${quoteIdentifier(orderColumn)} desc` : '',
        `limit ${boundedLimit}`,
      ]
        .filter(Boolean)
        .join(' ');
      const rows = db.query(sql).all() as Record<string, unknown>[];
      return rows.map((row, index) => mapRunRow(row, table.name, index));
    } catch {
      return [];
    } finally {
      db.close();
    }
  }

  listRunsForTask(taskName: string, limit = 50): TaskRun[] {
    return this.listRuns(Math.max(limit, 100))
      .filter((run) => run.taskName === taskName)
      .slice(0, limit);
  }
}

interface RunTableCandidate {
  name: string;
  columns: string[];
}

function findRunTable(db: Database): RunTableCandidate | undefined {
  const tables = db
    .query("select name from sqlite_master where type = 'table'")
    .all() as Array<{ name?: unknown }>;
  const candidates = tables
    .map((table) => String(table.name ?? ''))
    .filter((name) => name && !name.startsWith('sqlite_'))
    .map((name) => ({ name, columns: readColumns(db, name) }))
    .filter((table) => table.columns.length > 0)
    .sort((a, b) => scoreRunTable(b) - scoreRunTable(a));

  return candidates.find((table) => scoreRunTable(table) > 0);
}

function readColumns(db: Database, tableName: string): string[] {
  return (
    db
      .query(`pragma table_info(${quoteIdentifier(tableName)})`)
      .all() as Array<{
      name?: unknown;
    }>
  )
    .map((row) => String(row.name ?? ''))
    .filter(Boolean);
}

function scoreRunTable(table: RunTableCandidate): number {
  const lowerName = table.name.toLowerCase();
  const lowerColumns = table.columns.map((column) => column.toLowerCase());
  let score = RUN_TABLE_HINTS.some((hint) => lowerName.includes(hint)) ? 3 : 0;
  if (
    TASK_NAME_COLUMNS.some((column) =>
      lowerColumns.includes(column.toLowerCase()),
    )
  )
    score += 3;
  if (STATUS_COLUMNS.some((column) => lowerColumns.includes(column)))
    score += 2;
  if (
    SESSION_COLUMNS.some((column) =>
      lowerColumns.includes(column.toLowerCase()),
    )
  )
    score += 1;
  return score;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function findFirstColumn(
  columns: readonly string[],
  candidates: readonly string[],
): string | undefined {
  const lowerColumns = new Map(
    columns.map((column) => [column.toLowerCase(), column]),
  );
  for (const candidate of candidates) {
    const match = lowerColumns.get(candidate.toLowerCase());
    if (match) return match;
  }
  return undefined;
}

function mapRunRow(
  row: Record<string, unknown>,
  tableName: string,
  index: number,
): TaskRun {
  const columns = Object.keys(row);
  const idColumn =
    findFirstColumn(columns, ['id', 'run_id', 'uuid']) ?? columns[0];
  const taskColumn = findFirstColumn(columns, TASK_NAME_COLUMNS);
  const statusColumn = findFirstColumn(columns, STATUS_COLUMNS);
  const startColumn = findFirstColumn(columns, START_COLUMNS);
  const endColumn = findFirstColumn(columns, END_COLUMNS);
  const sessionColumn = findFirstColumn(columns, SESSION_COLUMNS);
  const errorColumn = findFirstColumn(columns, ERROR_COLUMNS);
  const pidColumn = findFirstColumn(columns, ['pid', 'process_id']);
  const taskName =
    stringFromUnknown(taskColumn ? row[taskColumn] : undefined) ?? 'unknown';
  const pid = numberFromUnknown(pidColumn ? row[pidColumn] : undefined);

  return {
    id:
      stringFromUnknown(idColumn ? row[idColumn] : undefined) ??
      `${tableName}:${index}`,
    taskName,
    status: normalizeRunStatus(statusColumn ? row[statusColumn] : undefined),
    startedAt: normalizeTimestamp(startColumn ? row[startColumn] : undefined),
    completedAt: normalizeTimestamp(endColumn ? row[endColumn] : undefined),
    sessionId: stringFromUnknown(
      sessionColumn ? row[sessionColumn] : undefined,
    ),
    error: stringFromUnknown(errorColumn ? row[errorColumn] : undefined),
    pid,
    raw: row,
  };
}

function stringFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' || typeof value === 'bigint')
    return String(value);
  return undefined;
}

function numberFromUnknown(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  }
  return undefined;
}

export class ReportRepository {
  constructor(private readonly paths: ControlCenterPaths) {}

  readReport(taskName: string): ReportSnapshot | undefined {
    const directPath = resolveContainedPath(
      this.paths.taskReportsDir,
      `${taskName}.md`,
    );
    if (existsSync(directPath)) return readReportFile(directPath);
    if (!existsSync(this.paths.taskReportsDir)) return undefined;
    const match = readdirSync(this.paths.taskReportsDir)
      .filter((entry) => entry.endsWith('.md'))
      .find((entry) => entry.includes(taskName));
    return match
      ? readReportFile(join(this.paths.taskReportsDir, match))
      : undefined;
  }
}

function resolveContainedPath(root: string, child: string): string {
  const rootPath = resolve(root);
  const targetPath = resolve(rootPath, child);
  const pathFromRoot = relative(rootPath, targetPath);
  if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) {
    return join(rootPath, '__invalid__');
  }
  return targetPath;
}

function readReportFile(path: string): ReportSnapshot {
  const stat = statSync(path);
  return {
    path,
    updatedAt: stat.mtime.toISOString(),
    content: readFileSync(path, 'utf-8'),
  };
}

export async function defaultCommandRunner(
  command: string,
  args: readonly string[],
  timeoutMs = 2500,
): Promise<CommandResult> {
  let timeout: Timer | undefined;
  try {
    const proc = Bun.spawn([command, ...args], {
      stderr: 'pipe',
      stdout: 'pipe',
    });
    timeout = setTimeout(() => proc.kill(), timeoutMs);
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { exitCode, stdout, stderr };
  } catch (error) {
    return {
      exitCode: 127,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function runWithTimeout(
  runner: CommandRunner,
  command: string,
  args: readonly string[],
  timeoutMs: number,
): Promise<CommandResult> {
  let timeout: Timer | undefined;
  const timeoutPromise = new Promise<CommandResult>((resolve) => {
    timeout = setTimeout(
      () => resolve({ exitCode: 124, stdout: '', stderr: 'Timed out' }),
      timeoutMs,
    );
  });
  const result = await Promise.race([
    runner(command, args, timeoutMs),
    timeoutPromise,
  ]);
  if (timeout) clearTimeout(timeout);
  return result;
}

export class SchedulerHealthAdapter {
  constructor(
    private readonly paths: ControlCenterPaths,
    private readonly runner: CommandRunner = defaultCommandRunner,
  ) {}

  async getHealth(
    definitions: TaskDefinition[],
    runs: TaskRun[],
  ): Promise<SchedulerHealth> {
    const diagnostics: ValidationDiagnostic[] = [];
    const dbExists = existsSync(this.paths.tasksDbPath);
    const dbSize = dbExists ? statSync(this.paths.tasksDbPath).size : undefined;
    const invalidTasks = definitions.filter((task) =>
      task.diagnostics.some((entry) => entry.level === 'error'),
    ).length;
    const failedRuns = runs.filter((run) => run.status === 'failed').length;
    const statusResult = await runWithTimeout(
      this.runner,
      'bunx',
      ['opencode-tasks', '--status'],
      2500,
    );
    const timer = await this.readSystemdTimer(diagnostics);

    if (!dbExists)
      diagnostics.push({
        level: 'warning',
        message: 'Task database not found',
      });
    if (invalidTasks > 0) {
      diagnostics.push({
        level: 'error',
        message: `${invalidTasks} task files are invalid`,
      });
    }
    if (statusResult.exitCode !== 0) {
      diagnostics.push({
        level: 'warning',
        message: `opencode-tasks status unavailable: ${firstLine(statusResult.stderr)}`,
      });
    }

    const status =
      invalidTasks > 0 ? 'error' : diagnostics.length > 0 ? 'warning' : 'ok';

    return {
      status,
      summary:
        statusResult.exitCode === 0
          ? firstLine(statusResult.stdout)
          : 'Scheduler status unknown',
      timer: timer.timer,
      service: timer.service,
      database: {
        exists: dbExists,
        path: this.paths.tasksDbPath,
        sizeBytes: dbSize,
      },
      tasks: {
        total: definitions.length,
        enabled: definitions.filter((task) => task.enabled).length,
        invalid: invalidTasks,
      },
      recentFailureCount: failedRuns,
      diagnostics,
      checkedAt: new Date().toISOString(),
    };
  }

  async readSchedulerEvents(limit = 50): Promise<StreamEvent[]> {
    if (platform() !== 'linux') return [];
    const result = await runWithTimeout(
      this.runner,
      'journalctl',
      [
        '--user',
        '-u',
        'opencode-tasks.timer',
        '-u',
        'opencode-tasks.service',
        '-n',
        String(limit),
        '--no-pager',
      ],
      2500,
    );
    if (result.exitCode !== 0) return [];
    return result.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => ({
        source: 'scheduler' as const,
        severity: /fail|error/i.test(line) ? 'warning' : 'info',
        text: line,
      }));
  }

  private async readSystemdTimer(diagnostics: ValidationDiagnostic[]): Promise<{
    timer?: SchedulerHealth['timer'];
    service?: SchedulerHealth['service'];
  }> {
    if (platform() !== 'linux') return {};
    const [enabled, timerActive, serviceActive] = await Promise.all([
      runWithTimeout(
        this.runner,
        'systemctl',
        ['--user', 'is-enabled', 'opencode-tasks.timer'],
        1200,
      ),
      runWithTimeout(
        this.runner,
        'systemctl',
        ['--user', 'is-active', 'opencode-tasks.timer'],
        1200,
      ),
      runWithTimeout(
        this.runner,
        'systemctl',
        ['--user', 'is-active', 'opencode-tasks.service'],
        1200,
      ),
    ]);
    if (enabled.exitCode !== 0 && timerActive.exitCode !== 0) {
      diagnostics.push({
        level: 'warning',
        message: 'systemd user timer status unavailable',
      });
    }
    return {
      timer: {
        enabled: enabled.stdout.trim() === 'enabled',
        active: timerActive.stdout.trim() === 'active',
      },
      service: {
        active: serviceActive.stdout.trim() === 'active',
        result: serviceActive.stdout.trim() || firstLine(serviceActive.stderr),
      },
    };
  }
}

function firstLine(value: string): string {
  return value.trim().split(/\r?\n/)[0] || 'no output';
}
