const CANONICAL_MODES = [
  'normal',
  'lite',
  'full',
  'ultra',
  'wenyan-lite',
  'wenyan',
  'wenyan-ultra',
  'commit',
  'review',
] as const;

export type CavemanMode = (typeof CANONICAL_MODES)[number];

export const DEFAULT_MODE: CavemanMode = 'ultra';

export const MODE_ALIASES: Record<string, CavemanMode> = {
  '': DEFAULT_MODE,
  on: DEFAULT_MODE,
  off: 'normal',
  stop: 'normal',
  none: 'normal',
  clear: 'normal',
  normal: 'normal',
  default: DEFAULT_MODE,
  wenyanfull: 'wenyan',
  'wenyan-full': 'wenyan',
  wenyan: 'wenyan',
};

const CANONICAL_MODE_SET = new Set<CavemanMode>(CANONICAL_MODES);

export function normalizeMode(rawMode: unknown): CavemanMode | null {
  const value = String(rawMode ?? '')
    .trim()
    .toLowerCase();
  const aliased = MODE_ALIASES[value] ?? value;

  if (!CANONICAL_MODE_SET.has(aliased as CavemanMode)) {
    return null;
  }

  return aliased as CavemanMode;
}

export function listModes(): CavemanMode[] {
  return [...CANONICAL_MODES];
}
