import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  handleTuiSidebarCommandExecuteBefore,
  registerTuiSidebarCommands,
} from './tui-sidebar-command';
import { readTuiSidebarState, writeTuiSidebarState } from './tui-state';

describe('tui sidebar commands', () => {
  let originalEnv: typeof process.env;
  let dataHome: string;

  beforeEach(() => {
    originalEnv = { ...process.env };
    dataHome = fs.mkdtempSync(path.join(os.tmpdir(), 'omos-sidebar-'));
    process.env.XDG_DATA_HOME = dataHome;
  });

  afterEach(() => {
    fs.rmSync(dataHome, { recursive: true, force: true });
    process.env = originalEnv;
  });

  test('registers real OpenCode sidebar commands', () => {
    const config: Record<string, unknown> = {};

    registerTuiSidebarCommands(config);

    expect(Object.keys(config.command as Record<string, unknown>)).toEqual([
      'board-toggle',
      'board-full',
      'board-compact',
      'board-minimal',
      'board-off',
    ]);
  });

  test('sets sidebar mode from a command', async () => {
    const output = { parts: [] as Array<{ type: string; text?: string }> };

    await handleTuiSidebarCommandExecuteBefore(
      { command: 'board-full' },
      output,
    );

    expect(readTuiSidebarState()).toEqual({
      mode: 'full',
      collapsedSections: [],
    });
    expect(output.parts[0]?.text).toContain('full');
  });

  test('toggles sidebar mode using persisted state', async () => {
    writeTuiSidebarState({ mode: 'compact', collapsedSections: ['BUILD'] });

    await handleTuiSidebarCommandExecuteBefore(
      { command: 'board-toggle' },
      { parts: [] },
    );

    expect(readTuiSidebarState()).toEqual({
      mode: 'minimal',
      collapsedSections: [],
    });
  });
});
