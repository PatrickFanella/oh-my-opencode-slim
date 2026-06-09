import type {
  ControlCenterSnapshot,
  StreamEvent,
  TaskDetail,
  TaskSummary,
} from './types';

export type ControlCenterStreamTab =
  | 'scheduler'
  | 'session'
  | 'runs'
  | 'report';

export interface ControlCenterViewState {
  selectedIndex: number;
  streamTab: ControlCenterStreamTab;
  filter: string;
  follow: boolean;
  filterMode?: boolean;
  message?: string;
}

const TAB_ORDER: ControlCenterStreamTab[] = [
  'scheduler',
  'session',
  'runs',
  'report',
];

export function getNextStreamTab(
  tab: ControlCenterStreamTab,
): ControlCenterStreamTab {
  const index = TAB_ORDER.indexOf(tab);
  return TAB_ORDER[(index + 1) % TAB_ORDER.length];
}

export function createDefaultViewState(): ControlCenterViewState {
  return {
    selectedIndex: 0,
    streamTab: 'scheduler',
    filter: '',
    follow: true,
  };
}

export function getVisibleTasks(
  tasks: readonly TaskSummary[],
  filter: string,
): TaskSummary[] {
  const needle = filter.trim().toLowerCase();
  if (!needle) return [...tasks];
  return tasks.filter((task) => task.name.toLowerCase().includes(needle));
}

export function renderControlCenterText(
  snapshot: ControlCenterSnapshot,
  state: ControlCenterViewState,
  width = 100,
  height = 32,
): string {
  const safeWidth = Math.max(72, width);
  const safeHeight = Math.max(18, height);
  const leftWidth = Math.min(30, Math.max(22, Math.floor(safeWidth * 0.32)));
  const rightWidth = safeWidth - leftWidth - 3;
  const visibleTasks = getVisibleTasks(snapshot.tasks, state.filter);
  const selected =
    visibleTasks[Math.min(state.selectedIndex, visibleTasks.length - 1)];
  const detail =
    selected?.name === snapshot.selectedTask?.name
      ? snapshot.selectedTask
      : undefined;
  const taskLines = renderTaskList(
    visibleTasks,
    state,
    leftWidth,
    safeHeight - 4,
  );
  const detailLines = renderDetailPanel(
    detail,
    snapshot,
    state,
    rightWidth,
    safeHeight - 4,
  );
  const rows: string[] = [];

  rows.push(
    `Blacktower Control Center ${snapshot.health.status.toUpperCase()} ${snapshot.generatedAt}`,
  );
  rows.push(
    `Keys: j/k move · Tab stream · / filter · r refresh · f follow · o session command · q quit`,
  );
  if (state.filter || state.filterMode || state.message) {
    rows.push(
      `Filter: ${state.filter || '∅'}${state.filterMode ? ' _' : ''}${state.message ? ` · ${state.message}` : ''}`,
    );
  }
  rows.push(`${'Tasks'.padEnd(leftWidth)} │ Selected task / scheduler health`);
  rows.push(`${'─'.repeat(leftWidth)}─┼─${'─'.repeat(rightWidth)}`);

  const panelRows = Math.min(
    safeHeight - rows.length,
    Math.max(taskLines.length, detailLines.length),
  );
  for (let index = 0; index < panelRows; index += 1) {
    rows.push(
      `${pad(taskLines[index] ?? '', leftWidth)} │ ${pad(detailLines[index] ?? '', rightWidth)}`,
    );
  }

  return rows
    .slice(0, safeHeight)
    .map((line) => line.slice(0, safeWidth))
    .join('\n');
}

function renderTaskList(
  tasks: readonly TaskSummary[],
  state: ControlCenterViewState,
  width: number,
  maxRows: number,
): string[] {
  if (tasks.length === 0) return ['No tasks found'];
  return tasks.slice(0, maxRows).map((task, index) => {
    const selected = index === state.selectedIndex ? '›' : ' ';
    const glyph = task.definition?.enabled ? '✓' : task.definition ? '·' : '○';
    const status = task.latestRun?.status?.slice(0, 4) ?? 'none';
    return `${selected} ${glyph} ${task.name} ${status}`.slice(0, width);
  });
}

function renderDetailPanel(
  detail: TaskDetail | undefined,
  snapshot: ControlCenterSnapshot,
  state: ControlCenterViewState,
  width: number,
  maxRows: number,
): string[] {
  const lines: string[] = [];
  lines.push(
    `Scheduler: ${snapshot.health.summary} (${snapshot.health.recentFailureCount} recent failures)`,
  );
  lines.push(
    `Tasks: ${snapshot.health.tasks.enabled}/${snapshot.health.tasks.total} enabled · invalid ${snapshot.health.tasks.invalid}`,
  );
  lines.push(
    `DB: ${snapshot.health.database.exists ? 'present' : 'missing'} ${snapshot.health.database.path}`,
  );
  for (const diag of snapshot.health.diagnostics.slice(0, 3)) {
    lines.push(`${diag.level}: ${diag.message}`);
  }

  if (!detail) {
    lines.push('');
    lines.push('Select a task to inspect recent runs and reports.');
    return lines.slice(0, maxRows).map((line) => line.slice(0, width));
  }

  lines.push('');
  lines.push(`${detail.name} ${detail.badges.join(' · ')}`);
  lines.push(`schedule: ${detail.definition?.schedule ?? 'n/a'}`);
  lines.push(`next: ${detail.nextRunAt ?? 'unknown'}`);
  lines.push(`cwd: ${detail.definition?.cwd ?? 'n/a'}`);
  if (detail.latestRun) {
    lines.push(
      `latest: ${detail.latestRun.status} ${detail.latestRun.startedAt ?? ''} ${detail.latestRun.sessionId ?? ''}`,
    );
  }
  for (const warning of detail.warnings.slice(0, 3))
    lines.push(`warn: ${warning}`);
  lines.push('');
  lines.push(renderTabs(state.streamTab, state.follow));
  lines.push(
    ...renderStreamLines(detail, snapshot.schedulerEvents, state.streamTab),
  );

  return lines.slice(0, maxRows).map((line) => line.slice(0, width));
}

function renderTabs(tab: ControlCenterStreamTab, follow: boolean): string {
  return `${TAB_ORDER.map((entry) => (entry === tab ? `[${entry}]` : entry)).join(' ')} ${follow ? 'follow' : 'paused'}`;
}

function renderStreamLines(
  detail: TaskDetail,
  schedulerEvents: readonly StreamEvent[],
  tab: ControlCenterStreamTab,
): string[] {
  if (tab === 'runs') {
    return detail.runs.length
      ? detail.runs
          .slice(0, 8)
          .map(
            (run) =>
              `${run.status} ${run.startedAt ?? ''} ${run.sessionId ?? ''} ${run.error ?? ''}`,
          )
      : ['No runs recorded.'];
  }
  if (tab === 'report') {
    return detail.report
      ? detail.report.content.split(/\r?\n/).filter(Boolean).slice(-8)
      : ['No report file found.'];
  }
  if (tab === 'session') {
    const sessionId = detail.latestRun?.sessionId;
    return sessionId
      ? [`opencode -s ${sessionId}`]
      : ['No session id for latest run.'];
  }
  return schedulerEvents.length
    ? schedulerEvents.slice(-8).map((event) => event.text)
    : ['No scheduler log events available.'];
}

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width);
}
