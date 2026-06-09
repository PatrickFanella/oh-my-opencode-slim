import { Database } from 'bun:sqlite';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type CommandRunner,
  getDefaultControlCenterPaths,
  ReportRepository,
  SchedulerHealthAdapter,
  SqliteTaskRunRepository,
  TaskDefinitionFileRepository,
} from './adapters';

let tmpDir = '';

beforeEach(() => {
  tmpDir = join(
    '/tmp',
    `blacktower-control-center-${Date.now()}-${Math.random()}`,
  );
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe('control-center adapters', () => {
  test('reads recurring task definitions from task files', () => {
    const paths = getDefaultControlCenterPaths(tmpDir);
    mkdirSync(paths.tasksDir, { recursive: true });
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

    const repo = new TaskDefinitionFileRepository(paths);

    expect(repo.listDefinitions()).toMatchObject([
      { name: 'watch', enabled: true, schedule: '0 9 * * *' },
    ]);
  });

  test('reads task runs from a tolerant sqlite schema', () => {
    const dbPath = join(tmpDir, '.tasks.db');
    const db = new Database(dbPath);
    db.run(
      'create table task_runs (id text, task_name text, status text, started_at text, session_id text, error text, pid integer)',
    );
    db.run('insert into task_runs values (?, ?, ?, ?, ?, ?, ?)', [
      'run-1',
      'watch',
      'success',
      '2026-01-01T00:00:00Z',
      'sess-1',
      '',
      123,
    ]);
    db.close();

    const runs = new SqliteTaskRunRepository(dbPath).listRunsForTask('watch');

    expect(runs).toMatchObject([
      {
        id: 'run-1',
        taskName: 'watch',
        status: 'completed',
        sessionId: 'sess-1',
        pid: 123,
      },
    ]);
  });

  test('reads matching task reports', () => {
    const paths = getDefaultControlCenterPaths(tmpDir);
    mkdirSync(paths.taskReportsDir, { recursive: true });
    writeFileSync(join(paths.taskReportsDir, 'watch.md'), 'report body');

    expect(new ReportRepository(paths).readReport('watch')).toMatchObject({
      content: 'report body',
    });
  });

  test('builds scheduler health from injected command output', async () => {
    const paths = getDefaultControlCenterPaths(tmpDir);
    writeFileSync(paths.tasksDbPath, '');
    const runner: CommandRunner = async (command, args) => {
      if (command === 'bunx') {
        return { exitCode: 0, stdout: 'scheduler ok\n', stderr: '' };
      }
      if (args.includes('is-enabled')) {
        return { exitCode: 0, stdout: 'enabled\n', stderr: '' };
      }
      return { exitCode: 0, stdout: 'active\n', stderr: '' };
    };

    const health = await new SchedulerHealthAdapter(paths, runner).getHealth(
      [],
      [],
    );

    expect(health.status).toBe('ok');
    expect(health.summary).toBe('scheduler ok');
    expect(health.database.exists).toBe(true);
  });
});
