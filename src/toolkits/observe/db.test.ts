import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  countObserveState,
  hashString,
  openObserveDb,
  projectKey,
  resolveObserveDbPath,
} from './db';

describe('observe db', () => {
  test('project key uses FNV-1a over resolved directory', () => {
    const directory = join(
      tmpdir(),
      'observe-project',
      '..',
      'observe-project',
    );
    expect(projectKey(directory)).toBe(hashString(resolve(directory)));
  });

  test('resolves compatibility db path', () => {
    const baseConfigDir = mkdtempSync(join(tmpdir(), 'observe-config-'));
    const directory = join(tmpdir(), 'observe-project-path');
    const expected = join(
      baseConfigDir,
      'observe',
      `${projectKey(directory)}.db`,
    );

    expect(resolveObserveDbPath({ directory, baseConfigDir })).toBe(expected);
  });

  test('opens schema and reports counts', () => {
    const baseConfigDir = mkdtempSync(join(tmpdir(), 'observe-config-'));
    const directory = mkdtempSync(join(tmpdir(), 'observe-project-'));

    const context = openObserveDb({ directory, baseConfigDir });
    try {
      const counts = countObserveState(context.db);
      expect(context.dbPath).toContain(`${projectKey(directory)}.db`);
      expect(counts.activeCount).toBe(0);
      expect(counts.inactiveCount).toBe(0);
      expect(counts.eventCount).toBe(0);
    } finally {
      context.close();
    }
  });

  test('migrates legacy state and history once', () => {
    const baseConfigDir = mkdtempSync(join(tmpdir(), 'observe-config-'));
    const directory = mkdtempSync(join(tmpdir(), 'observe-project-'));

    writeFileSync(
      join(baseConfigDir, 'observe-state.json'),
      JSON.stringify({
        active: true,
        target: 'legacy-service',
        sessionID: 'legacy-session',
        interval: 30,
        maxCycles: 3,
      }),
    );
    writeFileSync(
      join(baseConfigDir, 'observe-history.jsonl'),
      `${JSON.stringify({
        at: '2026-05-16T00:00:00.000Z',
        type: 'legacy',
        summary: 'legacy event',
      })}\n`,
    );

    const context = openObserveDb({ directory, baseConfigDir });
    try {
      const counts = countObserveState(context.db);
      expect(counts.activeCount).toBe(1);
      expect(counts.eventCount).toBeGreaterThanOrEqual(2);
    } finally {
      context.close();
    }
  });
});
