import type {
  TuiCommand,
  TuiPluginApi,
  TuiPluginModule,
} from '@opencode-ai/plugin/tui';
import type { JSX } from '@opentui/solid';
import { createElement, insert, setProp } from '@opentui/solid';
import { createAgents } from './agents';
import {
  ALL_AGENT_NAMES,
  DEFAULT_DISABLED_AGENTS,
  SUBAGENT_NAMES,
} from './config/constants';
import { loadPluginConfig } from './config/loader';
import {
  DEFAULT_COLLAPSED_SIDEBAR_SECTIONS,
  getDefaultSidebarCollapseState,
  getNextSidebarMode,
  getSidebarStateForMode,
  normalizeSidebarCollapseState,
  readTuiSidebarState,
  readTuiSidebarStateAsync,
  readTuiSnapshot,
  readTuiSnapshotAsync,
  type SidebarCollapseState,
  type SidebarMode,
  type TuiAgentSnapshot,
  type TuiSnapshot,
  writeTuiSidebarState,
} from './tui-state';

export {
  getDefaultSidebarCollapseState,
  normalizeSidebarCollapseState,
} from './tui-state';

const PLUGIN_NAME = 'oh-my-opencode-slim';
const CONFIG_WARNING_COLOR = 'orange';
const OK = '●';
const IDLE = '○';
const WARN = '◆';
const HOME_PANEL_PLACEMENT = 'bottom-right';
const FALLBACK_SIDEBAR_AGENTS = SUBAGENT_NAMES.filter(
  (agent) =>
    agent !== 'councillor' &&
    agent !== 'council' &&
    !DEFAULT_DISABLED_AGENTS.includes(agent),
);
const BORDER = { type: 'single' };
const CORE_AGENT_ORDER = [
  'orchestrator',
  'explorer',
  'librarian',
  'oracle',
  'designer',
  'fixer',
  'observer',
  'council',
];

const CORE_AGENT_GLYPHS: Record<string, string> = {
  orchestrator: '◈',
  explorer: '⌁',
  librarian: '⌂',
  oracle: '◉',
  designer: '✦',
  fixer: '⚙',
  observer: '◌',
  council: '◇',
};

const BOARD_GROUPS = [
  {
    title: 'BUILD',
    glyph: '◆',
    names: [
      'backend-architect',
      'go-advisor',
      'python-advisor',
      'rust-advisor',
      'typescript-advisor',
      'qa-test-advisor',
    ],
  },
  {
    title: 'OPS',
    glyph: '◍',
    names: [
      'cloud-devops-advisor',
      'database-advisor',
      'observability-advisor',
      'ops-sre-advisor',
      'security-advisor',
    ],
  },
  {
    title: 'GROWTH',
    glyph: '✹',
    names: [
      'content-strategist',
      'copy-chief',
      'cro-strategist',
      'launch-strategist',
      'seo-strategist',
      'social-media-strategist',
    ],
  },
  {
    title: 'MYTH',
    glyph: '✶',
    names: [
      'docs-advisor',
      'media-producer',
      'story-editor',
      'subcult-creative-director',
      'worldbuilder',
    ],
  },
] as const;

type SidebarTheme = {
  accent: unknown;
  background: unknown;
  borderActive: unknown;
  success: unknown;
  text: unknown;
  textMuted: unknown;
  warning: unknown;
};

export interface SidebarAgentRow {
  name: string;
  handle: string;
  model: string;
  variant?: string;
  mode: 'primary' | 'subagent' | 'all';
  source: 'core' | 'custom' | 'internal';
  glyph: string;
}

export interface SidebarAgentSection {
  title: string;
  glyph: string;
  rows: SidebarAgentRow[];
}

export interface SidebarDisplaySection extends SidebarAgentSection {
  collapsed: boolean;
  visibleRows: SidebarAgentRow[];
}

interface SidebarRuntimeStatus {
  sessionStatus?: string;
  todos: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  diff: {
    files: number;
    additions: number;
    deletions: number;
  };
  mcp: { total: number; ready: number; warned: number };
  lsp: { total: number; ready: number };
  plugins: { total: number; active: number };
}

interface TuiConfigStatus {
  invalid: boolean;
  snapshot?: Pick<TuiSnapshot, 'preset' | 'agentModels' | 'agents'>;
}

type Child = JSX.Element | string | number | null | undefined | false;
type HomePanelPlacement = 'center' | 'bottom-right';

export interface HomePanelLayout {
  wrapper: Record<string, unknown>;
  panel: Record<string, unknown>;
}

async function readPackageVersion(): Promise<string | undefined> {
  try {
    const packageJson = (await Bun.file(
      new URL('../package.json', import.meta.url),
    ).json()) as { version?: unknown };

    return typeof packageJson.version === 'string'
      ? packageJson.version
      : undefined;
  } catch {
    return undefined;
  }
}

function element(
  tag: string,
  props: Record<string, unknown>,
  children: Child[] = [],
) {
  const node = createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) setProp(node, key, value);
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    insert(node, child);
  }

  return node as JSX.Element;
}

export function getHomePanelLayout(
  placement: HomePanelPlacement = HOME_PANEL_PLACEMENT,
): HomePanelLayout {
  return {
    wrapper: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: placement === 'center' ? 'center' : 'flex-end',
      paddingLeft: 1,
      paddingRight: 1,
    },
    panel: {
      width: '100%',
      maxWidth: 82,
      flexDirection: 'column',
      border: BORDER,
      paddingLeft: 1,
      paddingRight: 1,
      paddingTop: 1,
      paddingBottom: 1,
    },
  };
}

function text(props: Record<string, unknown>, children: Child[]) {
  return element('text', props, children);
}

function box(props: Record<string, unknown>, children: Child[] = []) {
  return element('box', props, children);
}

function truncate(value: string, max = 24): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function getTuiDirectory(api: {
  state?: { path?: { directory?: string } };
}): string {
  return api.state?.path?.directory ?? process.cwd();
}

function getAgentMode(name: string): TuiAgentSnapshot['mode'] {
  if (name === 'orchestrator') return 'primary';
  if (name === 'council') return 'all';
  return 'subagent';
}

function getAgentSource(name: string): TuiAgentSnapshot['source'] {
  return (ALL_AGENT_NAMES as readonly string[]).includes(name)
    ? 'core'
    : 'custom';
}

function buildConfigSnapshot(directory: string): TuiConfigStatus {
  let invalid = false;
  try {
    const config = loadPluginConfig(directory, {
      silent: true,
      onWarning: () => {
        invalid = true;
      },
    });
    const agentModels: Record<string, string> = {};
    const agents = createAgents(config)
      .filter((agent) => agent.name !== 'councillor')
      .map((agent) => {
        const configRecord = agent.config as Record<string, unknown>;
        const model =
          typeof configRecord.model === 'string'
            ? configRecord.model
            : 'default';
        agentModels[agent.name] = model;

        return {
          name: agent.name,
          ...(agent.displayName ? { displayName: agent.displayName } : {}),
          model,
          ...(typeof configRecord.variant === 'string'
            ? { variant: configRecord.variant }
            : {}),
          mode: getAgentMode(agent.name),
          source: getAgentSource(agent.name),
        } satisfies TuiAgentSnapshot;
      });

    return {
      invalid,
      snapshot: {
        ...(config.preset ? { preset: config.preset } : {}),
        agentModels,
        agents,
      },
    };
  } catch {
    return { invalid: true };
  }
}

function mergeSnapshots(
  persisted: TuiSnapshot,
  configSnapshot?: Pick<TuiSnapshot, 'preset' | 'agentModels' | 'agents'>,
): TuiSnapshot {
  if (!configSnapshot) return persisted;
  const persistedModels = persisted.agentModels ?? {};
  return {
    ...persisted,
    preset: persisted.preset ?? configSnapshot.preset,
    agentModels: { ...configSnapshot.agentModels, ...persistedModels },
    agents: configSnapshot.agents.map((agent) => ({
      ...agent,
      model: persistedModels[agent.name] ?? agent.model,
    })),
  };
}

export function formatSidebarModelName(model: string): string {
  const lastSlash = model.lastIndexOf('/');
  return lastSlash === -1 ? model : model.slice(lastSlash + 1);
}

export function getSidebarAgentNames(snapshot: TuiSnapshot): string[] {
  if (snapshot.agents?.length > 0) {
    return snapshot.agents
      .filter((agent) => !agent.hidden && agent.source !== 'internal')
      .map((agent) => agent.displayName ?? agent.name);
  }

  const configuredAgents = Object.keys(snapshot.agentModels);
  return configuredAgents.length > 0
    ? configuredAgents
    : FALLBACK_SIDEBAR_AGENTS;
}

function getAgentSortIndex(name: string): number {
  const index = CORE_AGENT_ORDER.indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getCustomGroupIndex(name: string): number {
  const index = BOARD_GROUPS.findIndex((group) =>
    (group.names as readonly string[]).includes(name),
  );
  return index === -1 ? BOARD_GROUPS.length : index;
}

function getCustomGroupTitle(name: string): string {
  return BOARD_GROUPS[getCustomGroupIndex(name)]?.title ?? 'OTHER';
}

function getCustomGroupGlyph(name: string): string {
  return BOARD_GROUPS[getCustomGroupIndex(name)]?.glyph ?? '✳';
}

function toSidebarAgentRow(agent: TuiAgentSnapshot): SidebarAgentRow {
  return {
    name: agent.name,
    handle: agent.displayName ?? agent.name,
    model: agent.model,
    ...(agent.variant ? { variant: agent.variant } : {}),
    mode: agent.mode,
    source: agent.source,
    glyph:
      agent.source === 'core'
        ? (CORE_AGENT_GLYPHS[agent.name] ?? '✳')
        : getCustomGroupGlyph(agent.name),
  };
}

export function getSidebarAgentSections(
  snapshot: TuiSnapshot,
): SidebarAgentSection[] {
  const agents = snapshot.agents ?? [];
  if (agents.length === 0) {
    return [
      {
        title: 'CORE BOARD',
        glyph: '◈',
        rows: getSidebarAgentNames(snapshot).map((name) => ({
          name,
          handle: name,
          model: snapshot.agentModels[name] ?? 'pending',
          mode: 'subagent',
          source: 'core',
          glyph: CORE_AGENT_GLYPHS[name] ?? '✳',
        })),
      },
    ];
  }

  const visibleAgents = agents.filter(
    (agent) => !agent.hidden && agent.source !== 'internal',
  );
  const coreRows = visibleAgents
    .filter((agent) => agent.source === 'core')
    .map(toSidebarAgentRow)
    .sort((a, b) => getAgentSortIndex(a.name) - getAgentSortIndex(b.name));
  const customRows = visibleAgents
    .filter((agent) => agent.source === 'custom')
    .map(toSidebarAgentRow)
    .sort((a, b) => {
      const groupDelta =
        getCustomGroupIndex(a.name) - getCustomGroupIndex(b.name);
      return groupDelta === 0 ? a.handle.localeCompare(b.handle) : groupDelta;
    });

  const sections: SidebarAgentSection[] = [];
  if (coreRows.length > 0) {
    sections.push({ title: 'CORE BOARD', glyph: '◈', rows: coreRows });
  }

  for (const group of BOARD_GROUPS) {
    const rows = customRows.filter(
      (row) => getCustomGroupTitle(row.name) === group.title,
    );
    if (rows.length > 0) {
      sections.push({ title: group.title, glyph: group.glyph, rows });
    }
  }

  const otherRows = customRows.filter(
    (row) => getCustomGroupTitle(row.name) === 'OTHER',
  );
  if (otherRows.length > 0) {
    sections.push({ title: 'OTHER', glyph: '✳', rows: otherRows });
  }

  return sections;
}

export function getSidebarDisplaySections(
  snapshot: TuiSnapshot,
  state: SidebarCollapseState = getDefaultSidebarCollapseState(),
): SidebarDisplaySection[] {
  if (state.mode === 'minimal' || state.mode === 'off') return [];

  const collapsedSections = new Set(
    state.mode === 'compact'
      ? [...DEFAULT_COLLAPSED_SIDEBAR_SECTIONS, ...state.collapsedSections]
      : state.collapsedSections,
  );

  return getSidebarAgentSections(snapshot).map((section) => {
    const collapsed = collapsedSections.has(section.title);
    return {
      ...section,
      collapsed,
      visibleRows: collapsed ? [] : section.rows,
    };
  });
}

function row(
  label: string,
  value: string,
  theme: { textMuted: unknown; text: unknown },
  valueColor?: unknown,
): JSX.Element {
  return box(
    { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
    [
      text({ fg: theme.textMuted }, [label]),
      text({ fg: valueColor ?? theme.text }, [value]),
    ],
  );
}

function sectionHeader(
  title: string,
  glyph: string,
  count: number,
  theme: SidebarTheme,
  collapsed = false,
): JSX.Element {
  const indicator = collapsed ? '+' : '-';
  return box(
    {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    [
      text({ fg: theme.accent }, [`${indicator} ${glyph} ${title}`]),
      text({ fg: theme.textMuted }, [String(count)]),
    ],
  );
}

function renderAgentRow(
  agent: SidebarAgentRow,
  theme: SidebarTheme,
): JSX.Element {
  const model = truncate(formatSidebarModelName(agent.model), 18);
  const variant = agent.variant ? `:${agent.variant}` : '';
  const label = truncate(`${agent.glyph} ${agent.handle}`, 24);
  return row(label, `${model}${variant}`, theme, theme.textMuted);
}

function compactCount(
  label: string,
  value: string | number,
  color: unknown,
): JSX.Element {
  return text({ fg: color }, [`${label}${value}`]);
}

function renderStatusStrip(
  runtime: SidebarRuntimeStatus,
  theme: SidebarTheme,
  configInvalid: boolean,
): JSX.Element {
  const statusColor = configInvalid ? theme.warning : theme.success;
  const mcpStatus = `${runtime.mcp.ready}/${runtime.mcp.total}`;
  const lspStatus = `${runtime.lsp.ready}/${runtime.lsp.total}`;
  const pluginStatus = `${runtime.plugins.active}/${runtime.plugins.total}`;

  return box(
    {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    [
      compactCount(
        configInvalid ? `${WARN} cfg ` : `${OK} cfg `,
        '',
        statusColor,
      ),
      compactCount('mcp ', mcpStatus, theme.textMuted),
      compactCount('lsp ', lspStatus, theme.textMuted),
      compactCount('plug ', pluginStatus, theme.textMuted),
    ],
  );
}

function renderSidebarHeader(input: {
  snapshot: TuiSnapshot;
  version: string;
  theme: SidebarTheme;
  agentCount: number;
  mode: SidebarMode;
}): JSX.Element {
  return box(
    {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    [
      box({ paddingLeft: 1, paddingRight: 1 }, [
        text({ fg: input.theme.text }, ['◈ OMOC']),
      ]),
      text({ fg: input.theme.textMuted }, [
        `${input.mode} · ${input.agentCount}`,
      ]),
    ],
  );
}

function renderWorkStrip(
  runtime: SidebarRuntimeStatus,
  theme: SidebarTheme,
): JSX.Element {
  const todoValue = runtime.todos.total
    ? `${runtime.todos.inProgress}/${runtime.todos.pending}/${runtime.todos.completed}`
    : '0';
  const diffValue = runtime.diff.files
    ? `${runtime.diff.files} ±${runtime.diff.additions}/${runtime.diff.deletions}`
    : 'clean';

  return box(
    {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },
    [
      compactCount('todo ', todoValue, theme.textMuted),
      compactCount('diff ', diffValue, theme.textMuted),
    ],
  );
}

function renderSidebar(
  snapshot: TuiSnapshot,
  version: string,
  theme: SidebarTheme,
  configInvalid: boolean,
  runtime: SidebarRuntimeStatus,
  state: SidebarCollapseState,
): JSX.Element {
  const configStatusRow = buildConfigStatusRow(configInvalid, theme);
  const allSections = getSidebarAgentSections(snapshot);
  const sections = getSidebarDisplaySections(snapshot, state);
  const totalAgentCount = allSections.reduce(
    (count, section) => count + section.rows.length,
    0,
  );
  const agentNodes = sections.flatMap((section) => [
    sectionHeader(
      section.title,
      section.glyph,
      section.rows.length,
      theme,
      section.collapsed,
    ),
    ...section.visibleRows.map((agent) => renderAgentRow(agent, theme)),
  ]);
  const minimalSummary = row(
    'board',
    `${totalAgentCount} agents · ${state.mode}`,
    theme,
    theme.textMuted,
  );
  const hiddenSummary = row('board', 'hidden', theme, theme.textMuted);
  const bodyNodes =
    state.mode === 'off'
      ? [hiddenSummary]
      : [
          renderStatusStrip(runtime, theme, configInvalid),
          renderWorkStrip(runtime, theme),
          configStatusRow,
          ...(state.mode === 'minimal' ? [minimalSummary] : []),
          ...agentNodes,
        ];

  return box(
    {
      width: '100%',
      flexDirection: 'column',
      border: BORDER,
      borderColor: theme.borderActive,
      paddingTop: 1,
      paddingBottom: 1,
      paddingLeft: 1,
      paddingRight: 1,
    },
    [
      renderSidebarHeader({
        snapshot,
        version,
        theme,
        agentCount: totalAgentCount,
        mode: state.mode,
      }),
      ...bodyNodes,
    ],
  );
}

function buildConfigStatusRow(
  configInvalid: boolean,
  theme: { textMuted: unknown },
): JSX.Element | null {
  if (!configInvalid) return null;

  return box(
    {
      width: '100%',
      flexDirection: 'column',
      marginTop: 1,
      marginBottom: 1,
    },
    [
      text({ fg: CONFIG_WARNING_COLOR }, ['Config invalid']),
      text({ fg: theme.textMuted }, ['Run doctor for details']),
    ],
  );
}

function emptyRuntimeStatus(): SidebarRuntimeStatus {
  return {
    todos: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    diff: { files: 0, additions: 0, deletions: 0 },
    mcp: { total: 0, ready: 0, warned: 0 },
    lsp: { total: 0, ready: 0 },
    plugins: { total: 0, active: 0 },
  };
}

function countTodos(
  todos: ReturnType<TuiPluginApi['state']['session']['todo']>,
): SidebarRuntimeStatus['todos'] {
  const result = {
    total: todos.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
  };
  for (const todo of todos) {
    if (todo.status === 'completed') result.completed += 1;
    else if (todo.status === 'in_progress') result.inProgress += 1;
    else result.pending += 1;
  }
  return result;
}

function countDiff(
  diff: ReturnType<TuiPluginApi['state']['session']['diff']>,
): SidebarRuntimeStatus['diff'] {
  return diff.reduce(
    (total, item) => ({
      files: total.files + 1,
      additions: total.additions + item.additions,
      deletions: total.deletions + item.deletions,
    }),
    { files: 0, additions: 0, deletions: 0 },
  );
}

function collectRuntimeStatus(
  api: TuiPluginApi,
  sessionId?: string,
): SidebarRuntimeStatus {
  const runtime = emptyRuntimeStatus();

  try {
    const mcps = api.state.mcp();
    runtime.mcp = {
      total: mcps.length,
      ready: mcps.filter((mcp) => mcp.status === 'connected').length,
      warned: mcps.filter(
        (mcp) =>
          mcp.status === 'failed' ||
          mcp.status === 'needs_auth' ||
          mcp.status === 'needs_client_registration',
      ).length,
    };
  } catch {}

  try {
    const lsps = api.state.lsp();
    runtime.lsp = {
      total: lsps.length,
      ready: lsps.filter((lsp) => lsp.status === 'connected').length,
    };
  } catch {}

  try {
    const plugins = api.plugins.list();
    runtime.plugins = {
      total: plugins.length,
      active: plugins.filter((plugin) => plugin.active).length,
    };
  } catch {}

  if (!sessionId) return runtime;

  try {
    runtime.sessionStatus = api.state.session.status(sessionId)?.type;
  } catch {}
  try {
    runtime.todos = countTodos(api.state.session.todo(sessionId));
  } catch {}
  try {
    runtime.diff = countDiff(api.state.session.diff(sessionId));
  } catch {}

  return runtime;
}

function renderSidebarFooter(
  runtime: SidebarRuntimeStatus,
  theme: SidebarTheme,
  state: SidebarCollapseState,
): JSX.Element {
  const session = runtime.sessionStatus ?? 'home';
  const hint = state.mode === 'off' ? '/board-full' : '/board-toggle';
  return box(
    {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 1,
      paddingRight: 1,
    },
    [
      text({ fg: theme.accent }, [`${IDLE} ${session}`]),
      text({ fg: theme.textMuted }, [hint]),
    ],
  );
}

function renderHomeBottom(
  snapshot: TuiSnapshot,
  theme: SidebarTheme,
  configInvalid: boolean,
): JSX.Element {
  const sections = getSidebarAgentSections(snapshot);
  const boardCount = sections.reduce(
    (count, section) => count + section.rows.length,
    0,
  );
  const layout = getHomePanelLayout();

  return box(layout.wrapper, [
    box(
      {
        ...layout.panel,
        borderColor: configInvalid ? theme.warning : theme.borderActive,
      },
      [
        text({ fg: theme.accent }, ['◈ OMOC Full Board loaded']),
        text({ fg: theme.textMuted }, [
          `${boardCount} agents · preset ${snapshot.preset ?? 'unknown'} · use @api-forge, @data-vault, @signal-planner`,
        ]),
      ],
    ),
  ]);
}

export function readConfigInvalid(directory: string): boolean {
  return buildConfigSnapshot(directory).invalid;
}

function registerSidebarCommands(
  api: TuiPluginApi,
  getState: () => SidebarCollapseState,
  setState: (state: SidebarCollapseState, label: string) => void,
): () => void {
  const applyMode = (mode: SidebarMode, label: string) => () => {
    setState(getSidebarStateForMode(mode), label);
  };
  const toggle = () => {
    const nextMode = getNextSidebarMode(getState().mode);
    setState(getSidebarStateForMode(nextMode), `Board ${nextMode}`);
  };

  const commands: TuiCommand[] = [
    {
      title: 'OMOC Board: Toggle',
      value: 'omoc.board.toggle',
      description: 'Cycle sidebar between compact, minimal, and full.',
      category: 'OMOC',
      slash: { name: 'board-toggle' },
      onSelect: toggle,
    },
    {
      title: 'OMOC Board: Full',
      value: 'omoc.board.full',
      description: 'Expand every sidebar section.',
      category: 'OMOC',
      slash: { name: 'board-full', aliases: ['board-expand'] },
      onSelect: applyMode('full', 'Board expanded'),
    },
    {
      title: 'OMOC Board: Compact',
      value: 'omoc.board.compact',
      description: 'Show core agents and collapse custom board groups.',
      category: 'OMOC',
      slash: { name: 'board-compact', aliases: ['board-collapse'] },
      onSelect: applyMode('compact', 'Board compact'),
    },
    {
      title: 'OMOC Board: Minimal',
      value: 'omoc.board.minimal',
      description: 'Show only the OMOC status summary.',
      category: 'OMOC',
      slash: { name: 'board-minimal' },
      onSelect: applyMode('minimal', 'Board minimal'),
    },
    {
      title: 'OMOC Board: Off',
      value: 'omoc.board.off',
      description: 'Hide the OMOC sidebar content.',
      category: 'OMOC',
      slash: { name: 'board-off' },
      onSelect: applyMode('off', 'Board hidden'),
    },
  ];

  return api.command.register(() => commands);
}

const plugin: TuiPluginModule & { id: string } = {
  id: `${PLUGIN_NAME}:tui`,
  tui: async (api, _options, meta) => {
    const version = meta.version ?? (await readPackageVersion()) ?? 'dev';
    let configDirectory = getTuiDirectory(api);
    let configStatus = buildConfigSnapshot(configDirectory);
    let configInvalid = configStatus.invalid;
    let snapshot = mergeSnapshots(readTuiSnapshot(), configStatus.snapshot);
    let sidebarState = readTuiSidebarState();
    const setSidebarState = (state: SidebarCollapseState, label: string) => {
      sidebarState = normalizeSidebarCollapseState(state);
      writeTuiSidebarState(sidebarState);
      try {
        api.ui.toast({ message: label, variant: 'info', duration: 1200 });
      } catch {}
      api.renderer.requestRender();
    };
    const disposeSidebarCommands = registerSidebarCommands(
      api,
      () => sidebarState,
      setSidebarState,
    );
    const renderTimer = setInterval(async () => {
      try {
        const currentDirectory = getTuiDirectory(api);
        if (currentDirectory !== configDirectory) {
          configDirectory = currentDirectory;
          configStatus = buildConfigSnapshot(configDirectory);
          configInvalid = configStatus.invalid;
        }
        snapshot = mergeSnapshots(
          await readTuiSnapshotAsync(),
          configStatus.snapshot,
        );
        sidebarState = await readTuiSidebarStateAsync();
        api.renderer.requestRender();
      } catch {
        // Ignore render errors; this is best-effort live status.
      }
    }, 1000);

    api.lifecycle.onDispose(() => {
      clearInterval(renderTimer);
      disposeSidebarCommands();
    });

    api.slots.register({
      order: 900,
      slots: {
        sidebar_content(_ctx, props) {
          const runtime = collectRuntimeStatus(api, props.session_id);
          return renderSidebar(
            snapshot,
            version,
            api.theme.current,
            configInvalid,
            runtime,
            sidebarState,
          );
        },
        sidebar_footer(_ctx, props) {
          return renderSidebarFooter(
            collectRuntimeStatus(api, props.session_id),
            api.theme.current,
            sidebarState,
          );
        },
        home_bottom() {
          return renderHomeBottom(snapshot, api.theme.current, configInvalid);
        },
      },
    });
  },
};

export default plugin;
