import { basename } from 'node:path';
import type {
  RecurringTaskDraft,
  TaskDefinition,
  TaskRun,
  TaskRunStatus,
  TaskSummary,
  ValidationDiagnostic,
  ValidationResult,
} from './types';

const CRON_BOUNDS = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const;

const STATUS_ALIASES: Record<string, TaskRunStatus> = {
  active: 'running',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  complete: 'completed',
  completed: 'completed',
  done: 'completed',
  error: 'failed',
  fail: 'failed',
  failed: 'failed',
  failure: 'failed',
  pending: 'pending',
  queued: 'pending',
  running: 'running',
  started: 'running',
  success: 'completed',
  succeeded: 'completed',
};

function diagnostic(
  level: ValidationDiagnostic['level'],
  message: string,
  path?: string,
  line?: number,
): ValidationDiagnostic {
  return { level, message, path, line };
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      return trimmed.startsWith('"')
        ? JSON.parse(trimmed)
        : trimmed.slice(1, -1).replaceAll("''", "'");
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseYamlKey(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return String(parseScalar(trimmed));
  }
  return trimmed;
}

function parseFrontmatterBlock(
  block: string,
  filePath: string,
): {
  frontmatter: Record<string, unknown>;
  diagnostics: ValidationDiagnostic[];
} {
  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> }> = [
    { indent: -1, value: root },
  ];
  const diagnostics: ValidationDiagnostic[] = [];
  const lines = block.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const trimmed = line.trim();
    const match = trimmed.match(/^("[^"]+"|'[^']+'|[^:]+):(.*)$/);
    if (!match) {
      diagnostics.push(
        diagnostic(
          'warning',
          `Ignoring unsupported frontmatter line: ${trimmed}`,
          filePath,
          index + 2,
        ),
      );
      continue;
    }

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const key = parseYamlKey(match[1]);
    const value = match[2].trim();
    const parent = stack[stack.length - 1].value;

    if (!value) {
      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ indent, value: child });
    } else {
      parent[key] = parseScalar(value);
    }
  }

  return { frontmatter: root, diagnostics };
}

export function deriveTaskNameFromPath(filePath: string): string {
  return basename(filePath).replace(/\.md$/i, '');
}

export function parseRecurringTaskMarkdown(
  filePath: string,
  content: string,
): TaskDefinition {
  const name = deriveTaskNameFromPath(filePath);
  const diagnostics: ValidationDiagnostic[] = [];
  let frontmatter: Record<string, unknown> = {};
  let prompt = content.trim();

  if (content.startsWith('---')) {
    const lines = content.split(/\r?\n/);
    const endIndex = lines.findIndex(
      (line, index) => index > 0 && line.trim() === '---',
    );
    if (endIndex === -1) {
      diagnostics.push(
        diagnostic(
          'error',
          'Missing closing frontmatter delimiter',
          filePath,
          1,
        ),
      );
    } else {
      const parsed = parseFrontmatterBlock(
        lines.slice(1, endIndex).join('\n'),
        filePath,
      );
      frontmatter = parsed.frontmatter;
      diagnostics.push(...parsed.diagnostics);
      prompt = lines
        .slice(endIndex + 1)
        .join('\n')
        .trim();
    }
  } else {
    diagnostics.push(
      diagnostic('warning', 'Task file has no frontmatter', filePath, 1),
    );
  }

  const definition: TaskDefinition = {
    name,
    filePath,
    description: stringValue(frontmatter.description),
    schedule: stringValue(frontmatter.schedule),
    enabled: frontmatter.enabled !== false,
    cwd: stringValue(frontmatter.cwd),
    sessionName: stringValue(
      frontmatter.session_name ?? frontmatter.sessionName,
    ),
    permissions: frontmatter.permission,
    prompt,
    frontmatter,
    diagnostics,
  };

  definition.diagnostics.push(
    ...validateTaskDefinition(definition).diagnostics,
  );
  return definition;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function validateTaskDefinition(
  task: Pick<
    TaskDefinition,
    | 'cwd'
    | 'diagnostics'
    | 'enabled'
    | 'filePath'
    | 'permissions'
    | 'prompt'
    | 'schedule'
  >,
): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];

  if (!task.schedule) {
    diagnostics.push(diagnostic('error', 'Missing schedule', task.filePath));
  } else {
    diagnostics.push(
      ...validateCronSchedule(task.schedule, task.filePath).diagnostics,
    );
  }

  if (!task.cwd)
    diagnostics.push(diagnostic('error', 'Missing cwd', task.filePath));
  if (!task.prompt.trim()) {
    diagnostics.push(
      diagnostic('error', 'Task prompt is empty', task.filePath),
    );
  }

  if (containsAskPermission(task.permissions)) {
    diagnostics.push(
      diagnostic(
        'error',
        'Scheduled tasks must not use ask permissions; background jobs cannot answer prompts',
        task.filePath,
      ),
    );
  }

  if (task.permissions === undefined) {
    diagnostics.push(
      diagnostic(
        'warning',
        'Task has no explicit permission block',
        task.filePath,
      ),
    );
  }

  return {
    ok: !diagnostics.some((entry) => entry.level === 'error'),
    diagnostics,
  };
}

export function validateRecurringTaskDraft(
  input: RecurringTaskDraft,
): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(input.name)) {
    diagnostics.push(
      diagnostic(
        'error',
        'Task name must be file-safe letters, numbers, dots, dashes, or underscores',
      ),
    );
  }
  if (!input.description.trim())
    diagnostics.push(diagnostic('error', 'Missing description'));
  if (!input.cwd.trim()) diagnostics.push(diagnostic('error', 'Missing cwd'));
  if (!input.prompt.trim())
    diagnostics.push(diagnostic('error', 'Task prompt is empty'));
  diagnostics.push(...validateCronSchedule(input.schedule).diagnostics);
  if (input.permissions === undefined) {
    diagnostics.push(
      diagnostic('error', 'Task creation requires explicit permissions'),
    );
  }
  if (containsAskPermission(input.permissions)) {
    diagnostics.push(
      diagnostic('error', 'Task permissions must not contain ask'),
    );
  }

  return {
    ok: !diagnostics.some((entry) => entry.level === 'error'),
    diagnostics,
  };
}

export function validateCronSchedule(
  schedule: string,
  path?: string,
): ValidationResult {
  const fields = schedule.trim().split(/\s+/);
  const diagnostics: ValidationDiagnostic[] = [];
  if (fields.length !== 5) {
    diagnostics.push(
      diagnostic('error', 'Schedule must be a 5-field cron expression', path),
    );
    return { ok: false, diagnostics };
  }

  for (const [index, field] of fields.entries()) {
    const values = parseCronField(
      field,
      CRON_BOUNDS[index][0],
      CRON_BOUNDS[index][1],
    );
    if (!values) {
      diagnostics.push(
        diagnostic('error', `Invalid cron field ${index + 1}: ${field}`, path),
      );
    }
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics,
  };
}

function parseCronField(
  field: string,
  min: number,
  max: number,
): Set<number> | null {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    if (!part) return null;
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart ? Number(stepPart) : 1;
    if (!Number.isInteger(step) || step < 1) return null;

    let start = min;
    let end = max;
    if (rangePart !== '*') {
      const range = rangePart.split('-').map(Number);
      if (range.length === 1) {
        start = range[0];
        end = range[0];
      } else if (range.length === 2) {
        [start, end] = range;
      } else {
        return null;
      }
    }

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < min ||
      end > max ||
      start > end
    ) {
      return null;
    }

    for (let value = start; value <= end; value += step) {
      values.add(value === 7 && max === 7 ? 0 : value);
    }
  }
  return values;
}

function containsAskPermission(value: unknown): boolean {
  if (value === 'ask') return true;
  if (Array.isArray(value)) return value.some(containsAskPermission);
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsAskPermission);
  }
  return false;
}

export function getNextCronRun(
  schedule: string | undefined,
  from = new Date(),
): string | undefined {
  if (!schedule || !validateCronSchedule(schedule).ok) return undefined;
  const fields = schedule.trim().split(/\s+/);
  const allowed = fields.map((field, index) =>
    parseCronField(field, CRON_BOUNDS[index][0], CRON_BOUNDS[index][1]),
  );
  if (allowed.some((field) => !field)) return undefined;

  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);
  const limit = 366 * 24 * 60;

  for (let minute = 0; minute < limit; minute += 1) {
    const dayOfWeek = cursor.getDay();
    if (
      allowed[0]?.has(cursor.getMinutes()) &&
      allowed[1]?.has(cursor.getHours()) &&
      allowed[2]?.has(cursor.getDate()) &&
      allowed[3]?.has(cursor.getMonth() + 1) &&
      allowed[4]?.has(dayOfWeek)
    ) {
      return cursor.toISOString();
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return undefined;
}

export function normalizeRunStatus(value: unknown): TaskRunStatus {
  if (typeof value !== 'string') return 'unknown';
  return STATUS_ALIASES[value.trim().toLowerCase()] ?? 'unknown';
}

export function summarizeTask(input: {
  definition?: TaskDefinition;
  latestRun?: TaskRun;
  name: string;
  now?: Date;
}): TaskSummary {
  const badges: string[] = [];
  const warnings: string[] = [];
  const definition = input.definition;
  const latestRun = input.latestRun;

  if (definition) {
    badges.push(definition.enabled ? 'enabled' : 'disabled');
    warnings.push(
      ...definition.diagnostics
        .filter((entry) => entry.level !== 'info')
        .map((entry) => entry.message),
    );
  } else {
    badges.push('run-only');
    warnings.push('No recurring task file found');
  }

  if (latestRun) badges.push(latestRun.status);

  return {
    name: input.name,
    definition,
    latestRun,
    nextRunAt: getNextCronRun(definition?.schedule, input.now),
    badges,
    warnings,
  };
}

function serializeScalar(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return JSON.stringify(String(value ?? ''));
}

function serializeYamlObject(value: unknown, indent = 0): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const prefix = ' '.repeat(indent);
  const lines: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    const safeKey = /^[a-zA-Z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      lines.push(`${prefix}${safeKey}:`);
      lines.push(...serializeYamlObject(entry, indent + 2));
    } else {
      lines.push(`${prefix}${safeKey}: ${serializeScalar(entry)}`);
    }
  }
  return lines;
}

export function renderRecurringTaskDraft(input: RecurringTaskDraft): string {
  const frontmatter: Record<string, unknown> = {
    description: input.description,
    schedule: input.schedule,
    cwd: input.cwd,
  };
  if (input.sessionName) frontmatter.session_name = input.sessionName;
  if (input.permissions !== undefined)
    frontmatter.permission = input.permissions;
  frontmatter.enabled = input.enabled === true;

  return `---\n${serializeYamlObject(frontmatter).join('\n')}\n---\n\n${input.prompt.trim()}\n`;
}
