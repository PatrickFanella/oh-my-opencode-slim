import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const REVIEW_STATE_PATH = join(
  homedir(),
  '.config',
  'opencode',
  'review-tools-state.json',
);

export type ReviewState = {
  autoReview: boolean;
  lastNotifiedAt: string | null;
  lastNotifiedFingerprint: string;
};

type StateIo = {
  readFileSync: typeof readFileSync;
  writeFileSync: typeof writeFileSync;
  mkdirSync: typeof mkdirSync;
};

export type ReviewStateOptions = {
  statePath?: string;
  io?: Partial<StateIo>;
};

export function defaultReviewState(): ReviewState {
  return {
    autoReview: false,
    lastNotifiedAt: null,
    lastNotifiedFingerprint: '',
  };
}

export function normalizeReviewState(value: unknown): ReviewState {
  if (!value || typeof value !== 'object') {
    return defaultReviewState();
  }

  const record = value as Record<string, unknown>;
  return {
    autoReview: Boolean(record.autoReview),
    lastNotifiedAt:
      typeof record.lastNotifiedAt === 'string' ? record.lastNotifiedAt : null,
    lastNotifiedFingerprint:
      typeof record.lastNotifiedFingerprint === 'string'
        ? record.lastNotifiedFingerprint
        : '',
  };
}

export function loadReviewState(options: ReviewStateOptions = {}): ReviewState {
  const statePath = options.statePath ?? REVIEW_STATE_PATH;
  const io = {
    readFileSync,
    ...options.io,
  };

  try {
    const raw = io.readFileSync(statePath, 'utf8');
    return normalizeReviewState(JSON.parse(raw));
  } catch {
    return defaultReviewState();
  }
}

export function saveReviewState(
  state: ReviewState,
  options: ReviewStateOptions = {},
): void {
  const statePath = options.statePath ?? REVIEW_STATE_PATH;
  const io = {
    mkdirSync,
    writeFileSync,
    ...options.io,
  };

  io.mkdirSync(dirname(statePath), { recursive: true });
  io.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

export function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
