import { describe, expect, test } from 'bun:test';
import {
  getNextCronRun,
  parseRecurringTaskMarkdown,
  renderRecurringTaskDraft,
  summarizeTask,
  validateCronSchedule,
  validateRecurringTaskDraft,
} from './domain';

describe('control-center domain', () => {
  test('parses recurring task markdown frontmatter and prompt', () => {
    const task = parseRecurringTaskMarkdown(
      '/tmp/opencode/tasks/watch.md',
      `---
description: "Watch scheduler"
schedule: "*/15 * * * *"
cwd: "/home/tester"
session_name: "watch"
permission:
  bash:
    "*": "allow"
    "sudo *": "deny"
  read: "allow"
enabled: false
---

Check scheduler health.
`,
    );

    expect(task).toMatchObject({
      name: 'watch',
      description: 'Watch scheduler',
      schedule: '*/15 * * * *',
      cwd: '/home/tester',
      sessionName: 'watch',
      enabled: false,
      prompt: 'Check scheduler health.',
    });
    expect(task.diagnostics.filter((entry) => entry.level === 'error')).toEqual(
      [],
    );
  });

  test('defaults missing enabled frontmatter to enabled', () => {
    const task = parseRecurringTaskMarkdown(
      '/tmp/opencode/tasks/watch.md',
      `---
description: "Watch scheduler"
schedule: "0 9 * * *"
cwd: "/home/tester"
permission:
  read: "allow"
---

Check scheduler health.
`,
    );

    expect(task.enabled).toBe(true);
  });

  test('validates cron and rejects ask permissions for background tasks', () => {
    expect(validateCronSchedule('0 9 * * 1-5').ok).toBe(true);
    expect(validateCronSchedule('0 99 * * *').ok).toBe(false);

    const validation = validateRecurringTaskDraft({
      name: 'daily-plan',
      description: 'Daily plan',
      schedule: '0 9 * * *',
      cwd: '/tmp',
      permissions: { bash: { '*': 'ask' } },
      prompt: 'Plan the day.',
    });

    expect(validation.ok).toBe(false);
    expect(
      validation.diagnostics.map((entry) => entry.message).join('\n'),
    ).toContain('ask');
  });

  test('computes next cron run for common schedules', () => {
    expect(
      getNextCronRun('*/30 * * * *', new Date('2026-01-01T00:05:00Z')),
    ).toBe('2026-01-01T00:30:00.000Z');
  });

  test('summarizes enabled tasks with latest run badges', () => {
    const task = parseRecurringTaskMarkdown(
      '/tmp/opencode/tasks/watch.md',
      `---
description: "Watch scheduler"
schedule: "0 9 * * *"
cwd: "/tmp"
permission:
  read: "allow"
enabled: true
---
Prompt
`,
    );

    expect(
      summarizeTask({
        name: 'watch',
        definition: task,
        latestRun: {
          id: '1',
          taskName: 'watch',
          status: 'completed',
          raw: {},
        },
        now: new Date('2026-01-01T00:00:00Z'),
      }).badges,
    ).toEqual(['enabled', 'completed']);
  });

  test('renders task drafts with disabled default enabled state', () => {
    const rendered = renderRecurringTaskDraft({
      name: 'watch',
      description: 'Watch scheduler',
      schedule: '0 9 * * *',
      cwd: '/tmp',
      permissions: { read: 'allow' },
      prompt: 'Prompt',
    });

    expect(rendered).toContain('enabled: false');
    expect(rendered).toContain('read: "allow"');
  });
});
