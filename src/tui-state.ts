import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export type TuiAgentMode = 'primary' | 'subagent' | 'all';
export type TuiAgentSource = 'core' | 'custom' | 'internal';
export const SIDEBAR_MODES = ['full', 'compact', 'minimal', 'off'] as const;
export const DEFAULT_COLLAPSED_SIDEBAR_SECTIONS = [
  'BUILD',
  'OPS',
  'GROWTH',
  'MYTH',
];

export type SidebarMode = (typeof SIDEBAR_MODES)[number];

export interface SidebarCollapseState {
  mode: SidebarMode;
  collapsedSections: string[];
}

export interface TuiAgentSnapshot {
  name: string;
  displayName?: string;
  model: string;
  variant?: string;
  mode: TuiAgentMode;
  hidden?: boolean;
  source: TuiAgentSource;
}

export interface TuiSnapshot {
  version: 1;
  updatedAt: number;
  preset?: string;
  agentModels: Record<string, string>;
  agents: TuiAgentSnapshot[];
}

const STATE_DIR = 'oh-my-opencode-slim';
const STATE_FILE = 'tui-state.json';
const SIDEBAR_STATE_FILE = 'tui-sidebar.json';

function dataDir(): string {
  return (
    process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
  );
}

export function getTuiStatePath(): string {
  return path.join(dataDir(), 'opencode', 'storage', STATE_DIR, STATE_FILE);
}

export function getTuiSidebarStatePath(): string {
  return path.join(
    dataDir(),
    'opencode',
    'storage',
    STATE_DIR,
    SIDEBAR_STATE_FILE,
  );
}

function emptySnapshot(): TuiSnapshot {
  return {
    version: 1,
    updatedAt: Date.now(),
    agentModels: {},
    agents: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isSidebarMode(value: unknown): value is SidebarMode {
  return (SIDEBAR_MODES as readonly unknown[]).includes(value);
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== 'string' || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

export function getDefaultSidebarCollapseState(): SidebarCollapseState {
  return {
    mode: 'compact',
    collapsedSections: [...DEFAULT_COLLAPSED_SIDEBAR_SECTIONS],
  };
}

export function normalizeSidebarCollapseState(
  value: unknown,
): SidebarCollapseState {
  if (!isRecord(value)) return getDefaultSidebarCollapseState();

  const mode = isSidebarMode(value.mode) ? value.mode : 'compact';
  const collapsedSections = Array.isArray(value.collapsedSections)
    ? uniqueStrings(value.collapsedSections)
    : mode === 'compact'
      ? [...DEFAULT_COLLAPSED_SIDEBAR_SECTIONS]
      : [];

  return { mode, collapsedSections };
}

export function getSidebarStateForMode(
  mode: SidebarMode,
): SidebarCollapseState {
  return {
    mode,
    collapsedSections:
      mode === 'compact' ? [...DEFAULT_COLLAPSED_SIDEBAR_SECTIONS] : [],
  };
}

export function getNextSidebarMode(mode: SidebarMode): SidebarMode {
  if (mode === 'compact') return 'minimal';
  if (mode === 'minimal' || mode === 'off') return 'full';
  return 'compact';
}

function parseAgentSnapshot(value: unknown): TuiAgentSnapshot | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.name !== 'string') return undefined;
  if (typeof value.model !== 'string') return undefined;
  if (
    value.mode !== 'primary' &&
    value.mode !== 'subagent' &&
    value.mode !== 'all'
  ) {
    return undefined;
  }
  if (
    value.source !== 'core' &&
    value.source !== 'custom' &&
    value.source !== 'internal'
  ) {
    return undefined;
  }

  return {
    name: value.name,
    ...(typeof value.displayName === 'string'
      ? { displayName: value.displayName }
      : {}),
    model: value.model,
    ...(typeof value.variant === 'string' ? { variant: value.variant } : {}),
    mode: value.mode,
    ...(typeof value.hidden === 'boolean' ? { hidden: value.hidden } : {}),
    source: value.source,
  };
}

function parseAgentSnapshots(value: unknown): TuiAgentSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = parseAgentSnapshot(item);
    return parsed ? [parsed] : [];
  });
}

function parseSnapshot(value: string): TuiSnapshot {
  const parsed = JSON.parse(value) as Partial<TuiSnapshot> | undefined;
  if (parsed?.version !== 1) return emptySnapshot();

  return {
    version: 1,
    updatedAt:
      typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    ...(typeof parsed.preset === 'string' ? { preset: parsed.preset } : {}),
    agentModels: parsed.agentModels ?? {},
    agents: parseAgentSnapshots(parsed.agents),
  };
}

export function readTuiSnapshot(): TuiSnapshot {
  try {
    return parseSnapshot(fs.readFileSync(getTuiStatePath(), 'utf8'));
  } catch {
    return emptySnapshot();
  }
}

export async function readTuiSnapshotAsync(): Promise<TuiSnapshot> {
  try {
    return parseSnapshot(await fs.promises.readFile(getTuiStatePath(), 'utf8'));
  } catch {
    return emptySnapshot();
  }
}

export function readTuiSidebarState(): SidebarCollapseState {
  try {
    return normalizeSidebarCollapseState(
      JSON.parse(fs.readFileSync(getTuiSidebarStatePath(), 'utf8')),
    );
  } catch {
    return getDefaultSidebarCollapseState();
  }
}

export async function readTuiSidebarStateAsync(): Promise<SidebarCollapseState> {
  try {
    return normalizeSidebarCollapseState(
      JSON.parse(await fs.promises.readFile(getTuiSidebarStatePath(), 'utf8')),
    );
  } catch {
    return getDefaultSidebarCollapseState();
  }
}

export function writeTuiSidebarState(state: SidebarCollapseState): void {
  try {
    const filePath = getTuiSidebarStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `${JSON.stringify(normalizeSidebarCollapseState(state))}\n`,
    );
  } catch {
    // TUI state is best-effort only.
  }
}

function writeTuiSnapshot(snapshot: TuiSnapshot): void {
  try {
    const filePath = getTuiStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(snapshot)}\n`);
  } catch {
    // TUI state is best-effort only.
  }
}

function updateSnapshot(mutator: (snapshot: TuiSnapshot) => void): void {
  const snapshot = readTuiSnapshot();
  mutator(snapshot);
  snapshot.updatedAt = Date.now();
  writeTuiSnapshot(snapshot);
}

export function recordTuiAgentModels(input: {
  agentModels: Record<string, string>;
  agents?: TuiAgentSnapshot[];
  preset?: string;
}): void {
  updateSnapshot((snapshot) => {
    snapshot.agentModels = { ...input.agentModels };
    if (input.agents) snapshot.agents = [...input.agents];
    if (input.preset !== undefined) snapshot.preset = input.preset;
  });
}

export function recordTuiAgentModel(input: {
  agentName: string;
  model: string;
}): void {
  updateSnapshot((snapshot) => {
    snapshot.agentModels[input.agentName] = input.model;
    snapshot.agents = snapshot.agents.map((agent) =>
      agent.name === input.agentName || agent.displayName === input.agentName
        ? { ...agent, model: input.model }
        : agent,
    );
  });
}
