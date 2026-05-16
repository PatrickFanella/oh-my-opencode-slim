import {
  type MakeDirectoryOptions,
  mkdirSync,
  type PathLike,
  type RmOptions,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { type CavemanMode, DEFAULT_MODE, normalizeMode } from './modes';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const CAVEMAN_STATE_PATH = join(
  homedir(),
  '.config',
  'opencode',
  'caveman-state.json',
);

export const OPENCODE_FLAG_PATH = join(
  homedir(),
  '.config',
  'opencode',
  '.caveman-active',
);

export const LEGACY_FLAG_PATH = join(homedir(), '.claude', '.caveman-active');

type SessionState = {
  mode: CavemanMode;
  updatedAt: number;
};

export type CavemanState = {
  version: 1;
  defaultMode: CavemanMode;
  sessions: Record<string, SessionState>;
  updatedAt: number;
};

type StateIo = {
  readFileSync: typeof readFileSync;
  writeFileSync: typeof writeFileSync;
  mkdirSync: typeof mkdirSync;
  rmSync: typeof rmSync;
};

type Clock = {
  now: () => number;
};

export type CavemanStateOptions = {
  statePath?: string;
  flagPaths?: string[];
  io?: Partial<StateIo>;
  clock?: Partial<Clock>;
};

function resolveIo(options: CavemanStateOptions): StateIo {
  return {
    readFileSync,
    writeFileSync,
    mkdirSync,
    rmSync,
    ...options.io,
  };
}

function resolveNow(options: CavemanStateOptions): () => number {
  return options.clock?.now ?? Date.now;
}

function resolveStatePath(options: CavemanStateOptions): string {
  return options.statePath ?? CAVEMAN_STATE_PATH;
}

function resolveFlagPaths(options: CavemanStateOptions): string[] {
  return options.flagPaths ?? [OPENCODE_FLAG_PATH, LEGACY_FLAG_PATH];
}

function ensureDir(filePath: string, io: StateIo): void {
  io.mkdirSync(dirname(filePath), {
    recursive: true,
  } as MakeDirectoryOptions);
}

export function emptyState(options: CavemanStateOptions = {}): CavemanState {
  const now = resolveNow(options);

  return {
    version: 1,
    defaultMode: DEFAULT_MODE,
    sessions: {},
    updatedAt: now(),
  };
}

export function cleanState(
  state: unknown,
  options: CavemanStateOptions = {},
): CavemanState {
  const now = resolveNow(options);
  const safe = emptyState(options);
  const record =
    state && typeof state === 'object'
      ? (state as Record<string, unknown>)
      : undefined;

  const defaultMode = normalizeMode(record?.defaultMode) ?? DEFAULT_MODE;
  safe.defaultMode = defaultMode === 'normal' ? DEFAULT_MODE : defaultMode;

  const sessionsValue =
    record?.sessions && typeof record.sessions === 'object'
      ? (record.sessions as Record<string, unknown>)
      : {};

  const cutoff = now() - SESSION_TTL_MS;
  for (const [sessionID, info] of Object.entries(sessionsValue)) {
    if (!sessionID || typeof sessionID !== 'string') {
      continue;
    }

    if (!info || typeof info !== 'object') {
      continue;
    }

    const entry = info as Record<string, unknown>;
    const mode = normalizeMode(entry.mode);
    const updatedAt = Number(entry.updatedAt ?? 0);

    if (!mode) {
      continue;
    }

    if (updatedAt && updatedAt < cutoff) {
      continue;
    }

    safe.sessions[sessionID] = {
      mode,
      updatedAt: updatedAt || now(),
    };
  }

  safe.updatedAt = Number(record?.updatedAt ?? 0) || now();
  return safe;
}

export function loadState(options: CavemanStateOptions = {}): CavemanState {
  const io = resolveIo(options);
  const statePath = resolveStatePath(options);

  try {
    const raw = io.readFileSync(statePath, 'utf8');
    return cleanState(JSON.parse(raw), options);
  } catch {
    return emptyState(options);
  }
}

export function saveState(
  state: CavemanState,
  options: CavemanStateOptions = {},
): CavemanState {
  const io = resolveIo(options);
  const now = resolveNow(options);
  const statePath = resolveStatePath(options);

  const clean = cleanState(state, options);
  clean.updatedAt = now();

  ensureDir(statePath, io);
  io.writeFileSync(statePath, `${JSON.stringify(clean, null, 2)}\n`);
  return clean;
}

export function writeFlag(
  mode: CavemanMode,
  options: CavemanStateOptions = {},
): void {
  const io = resolveIo(options);
  const normalized = normalizeMode(mode);

  for (const flagPath of resolveFlagPaths(options)) {
    try {
      if (!normalized || normalized === 'normal') {
        io.rmSync(
          flagPath as PathLike,
          {
            force: true,
          } as RmOptions,
        );
        continue;
      }

      ensureDir(flagPath, io);
      io.writeFileSync(flagPath, normalized);
    } catch {
      // best-effort only
    }
  }
}

export function getSessionMode(
  state: CavemanState,
  sessionID?: string,
): CavemanMode {
  const override = sessionID ? state.sessions[sessionID]?.mode : undefined;
  if (override) {
    return normalizeMode(override) ?? DEFAULT_MODE;
  }

  return normalizeMode(state.defaultMode) ?? DEFAULT_MODE;
}

export function setSessionMode(
  sessionID: string,
  mode: CavemanMode,
  options: CavemanStateOptions = {},
): {
  mode: CavemanMode;
  defaultMode: CavemanMode;
  inherited: false;
} {
  const now = resolveNow(options);
  const state = loadState(options);

  state.sessions[sessionID] = {
    mode,
    updatedAt: now(),
  };

  const saved = saveState(state, options);
  writeFlag(mode, options);

  return {
    mode,
    defaultMode: saved.defaultMode,
    inherited: false,
  };
}

export function clearSessionMode(
  sessionID: string,
  options: CavemanStateOptions = {},
): {
  mode: CavemanMode;
  defaultMode: CavemanMode;
  inherited: true;
} {
  const state = loadState(options);
  delete state.sessions[sessionID];

  const saved = saveState(state, options);
  const mode = getSessionMode(saved, sessionID);
  writeFlag(mode, options);

  return {
    mode,
    defaultMode: saved.defaultMode,
    inherited: true,
  };
}

export function setDefaultMode(
  mode: CavemanMode,
  options: CavemanStateOptions = {},
): CavemanMode {
  const state = loadState(options);
  state.defaultMode = mode === 'normal' ? DEFAULT_MODE : mode;

  const saved = saveState(state, options);
  writeFlag(saved.defaultMode, options);

  return saved.defaultMode;
}

export function removeSession(
  sessionID: string,
  options: CavemanStateOptions = {},
): void {
  const state = loadState(options);
  if (!state.sessions[sessionID]) {
    return;
  }

  delete state.sessions[sessionID];
  saveState(state, options);
}

export function currentStatus(
  sessionID: string,
  options: CavemanStateOptions = {},
): {
  mode: CavemanMode;
  defaultMode: CavemanMode;
  inherited: boolean;
} {
  const state = loadState(options);
  const inherited = !state.sessions[sessionID];

  return {
    mode: getSessionMode(state, sessionID),
    defaultMode: state.defaultMode,
    inherited,
  };
}
