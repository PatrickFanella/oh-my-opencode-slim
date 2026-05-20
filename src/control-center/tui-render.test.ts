import { describe, expect, test } from 'bun:test';
import {
  createDefaultViewState,
  getNextStreamTab,
  renderControlCenterText,
} from './tui-render';
import type { ControlCenterSnapshot } from './types';

function snapshot(): ControlCenterSnapshot {
  return {
    generatedAt: '2026-01-01T00:00:00.000Z',
    health: {
      status: 'ok',
      summary: 'scheduler ok',
      database: { exists: true, path: '/tmp/.tasks.db' },
      tasks: { total: 1, enabled: 1, invalid: 0 },
      recentFailureCount: 0,
      diagnostics: [],
      checkedAt: '2026-01-01T00:00:00.000Z',
    },
    schedulerEvents: [
      { source: 'scheduler', severity: 'info', text: 'scheduler tick' },
    ],
    tasks: [
      {
        name: 'watch',
        badges: ['enabled', 'completed'],
        warnings: [],
        definition: {
          name: 'watch',
          filePath: '/tmp/tasks/watch.md',
          schedule: '0 9 * * *',
          enabled: true,
          cwd: '/tmp',
          prompt: 'Prompt',
          frontmatter: {},
          diagnostics: [],
        },
      },
    ],
    selectedTask: {
      name: 'watch',
      badges: ['enabled', 'completed'],
      warnings: [],
      definition: {
        name: 'watch',
        filePath: '/tmp/tasks/watch.md',
        schedule: '0 9 * * *',
        enabled: true,
        cwd: '/tmp',
        prompt: 'Prompt',
        frontmatter: {},
        diagnostics: [],
      },
      latestRun: {
        id: 'run-1',
        taskName: 'watch',
        status: 'completed',
        sessionId: 'sess-1',
        raw: {},
      },
      runs: [],
    },
  };
}

describe('control-center TUI renderer', () => {
  test('renders task list, health, and selected task detail', () => {
    const output = renderControlCenterText(
      snapshot(),
      createDefaultViewState(),
      100,
      24,
    );

    expect(output).toContain('OMOC Control Center OK');
    expect(output).toContain('watch');
    expect(output).toContain('scheduler ok');
    expect(output).toContain('scheduler tick');
  });

  test('cycles stream tabs in dashboard order', () => {
    expect(getNextStreamTab('scheduler')).toBe('session');
    expect(getNextStreamTab('report')).toBe('scheduler');
  });
});
