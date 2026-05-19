export type ShortcutCommand = 'setup' | 'preview' | 'update' | 'repair';

export type ShortcutTarget = 'bootstrap' | 'install';

export interface ShortcutDefinition {
  name: ShortcutCommand;
  target: ShortcutTarget;
  defaults: readonly string[];
  description: string;
  example: string;
}

export const CLI_SHORTCUTS = [
  {
    name: 'setup',
    target: 'bootstrap',
    defaults: ['--with-dcp', '--with-quota', '--with-rtk'],
    description: 'Full bootstrap',
    example: 'bunx oh-my-opencode-slim setup',
  },
  {
    name: 'preview',
    target: 'bootstrap',
    defaults: ['--with-dcp', '--with-quota', '--with-rtk', '--dry-run'],
    description: 'Bootstrap preview',
    example: 'bunx oh-my-opencode-slim preview',
  },
  {
    name: 'update',
    target: 'install',
    defaults: ['--no-tui', '--skills=yes'],
    description: 'Update existing install',
    example: 'bunx oh-my-opencode-slim update',
  },
  {
    name: 'repair',
    target: 'bootstrap',
    defaults: ['--with-dcp', '--with-quota', '--with-rtk', '--reset'],
    description: 'Recreate config directory',
    example: 'bunx oh-my-opencode-slim repair',
  },
] as const satisfies readonly ShortcutDefinition[];

export function isShortcutCommand(command: string): command is ShortcutCommand {
  return CLI_SHORTCUTS.some((shortcut) => shortcut.name === command);
}

export function hasHelpFlag(args: readonly string[]): boolean {
  return args.some((arg) => arg === '-h' || arg === '--help');
}

export function expandShortcutArgs(
  command: string,
  rest: readonly string[],
): {
  command: string;
  args: string[];
  shortcut?: ShortcutDefinition;
} {
  const shortcut = CLI_SHORTCUTS.find((entry) => entry.name === command);

  if (!shortcut) {
    return { command, args: [...rest] };
  }

  return {
    command: shortcut.target,
    args: [...shortcut.defaults, ...rest],
    shortcut,
  };
}

export function formatShortcutHelpSection(): string {
  const width = Math.max(
    ...CLI_SHORTCUTS.map((shortcut) => shortcut.name.length),
  );

  return [
    'Shortcuts:',
    ...CLI_SHORTCUTS.map(
      (shortcut) =>
        `  ${shortcut.name.padEnd(width)} ${shortcut.description} → ${shortcut.target} ${shortcut.defaults.join(' ')}`,
    ),
    '',
    'Examples:',
    ...CLI_SHORTCUTS.map((shortcut) => `  ${shortcut.example}`),
  ].join('\n');
}
