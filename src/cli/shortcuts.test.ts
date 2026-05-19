import { describe, expect, test } from 'bun:test';
import {
  CLI_SHORTCUTS,
  expandShortcutArgs,
  formatShortcutHelpSection,
  hasHelpFlag,
  isShortcutCommand,
} from './shortcuts';

describe('cli shortcuts', () => {
  test('expands setup with default bootstrap flags before rest args', () => {
    expect(
      expandShortcutArgs('setup', ['--no-dcp', '--preset=opencode-go']),
    ).toEqual({
      command: 'bootstrap',
      args: [
        '--with-dcp',
        '--with-quota',
        '--with-rtk',
        '--no-dcp',
        '--preset=opencode-go',
      ],
      shortcut: CLI_SHORTCUTS[0],
    });
  });

  test('expands preview and update shortcuts to their targets', () => {
    expect(expandShortcutArgs('preview', ['--no-quota'])).toEqual({
      command: 'bootstrap',
      args: [
        '--with-dcp',
        '--with-quota',
        '--with-rtk',
        '--dry-run',
        '--no-quota',
      ],
      shortcut: CLI_SHORTCUTS[1],
    });

    expect(expandShortcutArgs('update', ['--preset=opencode-go'])).toEqual({
      command: 'install',
      args: ['--no-tui', '--skills=yes', '--preset=opencode-go'],
      shortcut: CLI_SHORTCUTS[2],
    });
  });

  test('expands repair to reset bootstrap flow', () => {
    expect(expandShortcutArgs('repair', ['--no-scheduled-tasks'])).toEqual({
      command: 'bootstrap',
      args: [
        '--with-dcp',
        '--with-quota',
        '--with-rtk',
        '--reset',
        '--no-scheduled-tasks',
      ],
      shortcut: CLI_SHORTCUTS[3],
    });
  });

  test('recognizes shortcut help flags and renders help copy', () => {
    expect(hasHelpFlag(['--no-dcp', '-h'])).toBe(true);
    expect(isShortcutCommand('setup')).toBe(true);
    expect(isShortcutCommand('bootstrap')).toBe(false);

    const help = formatShortcutHelpSection();
    expect(help).toContain('Shortcuts:');
    expect(help).toContain('setup');
    expect(help).toContain('preview');
    expect(help).toContain('update');
    expect(help).toContain('repair');
    expect(help).toContain('Examples:');
  });
});
