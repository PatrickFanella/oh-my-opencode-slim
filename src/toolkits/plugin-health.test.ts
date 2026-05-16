import { describe, expect, test } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLoop, openObserveDb } from './observe/db';
import {
  collectPluginHealthStatus,
  createPluginHealthToolkit,
  type PluginHealthStatus,
  renderPluginHealthDoctor,
  renderPluginHealthStatus,
} from './plugin-health';

function statusFixture(): PluginHealthStatus {
  return {
    plugins: ['github-tools.js', 'review-tools.js'],
    commands: ['plugin-status.md', 'plugin-doctor.md'],
    binaries: { gh: '/usr/bin/gh', rtk: '/usr/bin/rtk' },
    states: {
      caveman: { defaultMode: 'ultra' },
      review: { autoReview: true },
      observe: { activeCount: 1, pendingCount: 0, nextCheckAt: null },
    },
  };
}

describe('plugin health toolkit', () => {
  test('renders status summary', () => {
    const text = renderPluginHealthStatus(statusFixture());

    expect(text).toContain('Plugins: 2');
    expect(text).toContain('Commands: 2');
    expect(text).toContain('Caveman default: ultra');
    expect(text).toContain('Auto-review: on');
    expect(text).toContain('Observe loops: active=1 pending=0');
    expect(text).toContain('gh binary: /usr/bin/gh');
    expect(text).toContain('rtk binary: /usr/bin/rtk');
  });

  test('renders no obvious issues for healthy status', () => {
    expect(renderPluginHealthDoctor(statusFixture())).toBe(
      'No obvious integrated toolkit health issues.',
    );
  });

  test('does not require legacy markdown command wrappers', () => {
    expect(
      renderPluginHealthDoctor({
        ...statusFixture(),
        commands: [],
      }),
    ).toBe('No obvious integrated toolkit health issues.');
  });

  test('registers plugin health commands', () => {
    const toolkit = createPluginHealthToolkit({ directory: '/tmp/project' });
    const config: Record<string, unknown> = {};

    toolkit.registerCommands(config);

    expect(config.command).toEqual({
      'plugin-status': {
        description: 'Show integrated toolkit status',
        template: 'Use the `plugin_status` tool.',
      },
      'plugin-doctor': {
        description: 'Diagnose integrated toolkit health',
        template: 'Use the `plugin_doctor` tool.',
      },
    });
  });

  test('reads observe counts from observe db when available', () => {
    const baseConfigDir = mkdtempSync(join(tmpdir(), 'plugin-health-observe-'));
    const directory = mkdtempSync(join(tmpdir(), 'plugin-health-project-'));

    const context = openObserveDb({ directory, baseConfigDir });
    try {
      createLoop(context.db, {
        sessionID: 'session-1',
        target: 'service-health',
        intervalSecs: 30,
        maxCycles: 5,
        successCriteria: 'healthy',
      });
    } finally {
      context.close();
    }

    const status = collectPluginHealthStatus({
      directory,
      observeEnabled: true,
      observeBaseConfigDir: baseConfigDir,
    });

    expect(status.states.observe.activeCount).toBe(1);
    expect(status.states.observe.pendingCount).toBe(0);
  });

  test('does not read or create observe db when observe is disabled', () => {
    const baseConfigDir = mkdtempSync(join(tmpdir(), 'plugin-health-observe-'));
    const directory = mkdtempSync(join(tmpdir(), 'plugin-health-project-'));

    const context = openObserveDb({ directory, baseConfigDir });
    try {
      createLoop(context.db, {
        sessionID: 'session-1',
        target: 'service-health',
        intervalSecs: 30,
        maxCycles: 5,
        successCriteria: 'healthy',
      });
    } finally {
      context.close();
    }

    const status = collectPluginHealthStatus({
      directory,
      observeEnabled: false,
      observeBaseConfigDir: baseConfigDir,
    });

    expect(status.states.observe.activeCount).toBe(0);
    expect(status.states.observe.pendingCount).toBe(0);
  });
});
