import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CAVEMAN_STATE_PATH,
  cleanState,
  currentStatus,
  LEGACY_FLAG_PATH,
  loadState,
  OPENCODE_FLAG_PATH,
  removeSession,
  SESSION_TTL_MS,
  saveState,
  setDefaultMode,
  setSessionMode,
  writeFlag,
} from './state';

describe('caveman state', () => {
  test('uses compatibility state and flag paths', () => {
    expect(CAVEMAN_STATE_PATH).toBe(
      join(homedir(), '.config', 'opencode', 'caveman-state.json'),
    );
    expect(OPENCODE_FLAG_PATH).toBe(
      join(homedir(), '.config', 'opencode', '.caveman-active'),
    );
    expect(LEGACY_FLAG_PATH).toBe(
      join(homedir(), '.claude', '.caveman-active'),
    );
  });

  test('loads defaults when state file is missing', () => {
    const project = mkdtempSync(join(tmpdir(), 'caveman-state-'));
    const statePath = join(project, 'missing.json');

    const state = loadState({ statePath });
    expect(state.defaultMode).toBe('ultra');
    expect(state.sessions).toEqual({});
  });

  test('saves and reloads state with injected path', () => {
    const project = mkdtempSync(join(tmpdir(), 'caveman-state-'));
    const statePath = join(project, 'caveman-state.json');

    saveState(
      {
        version: 1,
        defaultMode: 'lite',
        sessions: {
          s1: { mode: 'full', updatedAt: Date.now() },
        },
        updatedAt: Date.now(),
      },
      { statePath },
    );

    const loaded = loadState({ statePath });
    expect(loaded.defaultMode).toBe('lite');
    expect(loaded.sessions.s1?.mode).toBe('full');
  });

  test('cleanState removes ttl-expired sessions and coerces default', () => {
    const now = 10_000;
    const old = now - SESSION_TTL_MS - 1;

    const clean = cleanState(
      {
        defaultMode: 'normal',
        sessions: {
          keep: { mode: 'review', updatedAt: now },
          drop: { mode: 'full', updatedAt: old },
        },
      },
      { clock: { now: () => now } },
    );

    expect(clean.defaultMode).toBe('ultra');
    expect(clean.sessions.keep?.mode).toBe('review');
    expect(clean.sessions.drop).toBeUndefined();
  });

  test('writeFlag is best-effort across both paths', () => {
    const writes: Array<{ path: string; value: string }> = [];
    const removed: string[] = [];

    writeFlag('ultra', {
      flagPaths: ['/first', '/second'],
      io: {
        mkdirSync: () => undefined,
        writeFileSync: (path, value) => {
          if (String(path) === '/first') {
            throw new Error('fail first');
          }
          writes.push({ path: String(path), value: String(value) });
        },
        rmSync: (path) => {
          removed.push(String(path));
        },
      },
    });

    expect(writes).toEqual([{ path: '/second', value: 'ultra' }]);
    expect(removed).toEqual([]);
  });

  test('session set/remove/status operations work with temp files', () => {
    const project = mkdtempSync(join(tmpdir(), 'caveman-state-'));
    const statePath = join(project, 'caveman-state.json');
    const opencodeFlagPath = join(project, '.caveman-active');
    const legacyFlagPath = join(project, '.legacy-caveman-active');

    const options = {
      statePath,
      flagPaths: [opencodeFlagPath, legacyFlagPath],
    };

    setDefaultMode('review', options);
    setSessionMode('session-1', 'lite', options);
    expect(currentStatus('session-1', options).mode).toBe('lite');

    removeSession('session-1', options);
    const status = currentStatus('session-1', options);
    expect(status.mode).toBe('review');
    expect(status.inherited).toBe(true);

    expect(readFileSync(opencodeFlagPath, 'utf8')).toBe('lite');
  });
});
