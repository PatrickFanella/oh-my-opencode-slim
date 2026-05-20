import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CommandRunner, getDefaultControlCenterPaths } from './adapters';
import { createControlCenterServices } from './services';

let tmpDir = '';

beforeEach(() => {
  tmpDir = join(
    '/tmp',
    `omoc-control-center-service-${Date.now()}-${Math.random()}`,
  );
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe('control-center services', () => {
  test('creates a reusable snapshot from local adapters', async () => {
    const paths = getDefaultControlCenterPaths(tmpDir);
    mkdirSync(paths.tasksDir, { recursive: true });
    writeFileSync(paths.tasksDbPath, '');
    writeFileSync(
      join(paths.tasksDir, 'watch.md'),
      `---
description: "Watch"
schedule: "0 9 * * *"
cwd: "/tmp"
permission:
  read: "allow"
enabled: true
---
Prompt
`,
    );
    const runner: CommandRunner = async () => ({
      exitCode: 0,
      stdout: 'ok\n',
      stderr: '',
    });

    const services = createControlCenterServices({
      paths,
      commandRunner: runner,
      now: () => new Date('2026-01-01T00:00:00Z'),
    });
    const snapshot = await services.snapshot();

    expect(snapshot.tasks).toMatchObject([
      { name: 'watch', badges: ['enabled'] },
    ]);
    expect(snapshot.selectedTask?.name).toBe('watch');
    expect(snapshot.health.summary).toBe('ok');
  });
});
