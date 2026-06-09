import {
  getNextSidebarMode,
  getSidebarStateForMode,
  readTuiSidebarState,
  type SidebarMode,
  writeTuiSidebarState,
} from './tui-state';
import { createInternalAgentTextPart } from './utils';

const COMMANDS: Record<string, SidebarMode | 'toggle'> = {
  'board-toggle': 'toggle',
  'board-full': 'full',
  'board-compact': 'compact',
  'board-minimal': 'minimal',
  'board-off': 'off',
};

type CommandInput = {
  command: string;
};

type CommandOutput = {
  parts: Array<{ type: string; text?: string }>;
};

export function registerTuiSidebarCommands(
  opencodeConfig: Record<string, unknown>,
): void {
  const configCommand = opencodeConfig.command as
    | Record<string, unknown>
    | undefined;

  if (!opencodeConfig.command) {
    opencodeConfig.command = {};
  }

  const commands = opencodeConfig.command as Record<string, unknown>;
  for (const [name, mode] of Object.entries(COMMANDS)) {
    if (configCommand?.[name]) continue;
    commands[name] = {
      template: `Set Blacktower sidebar mode to ${mode}`,
      description: getCommandDescription(name),
    };
  }
}

export async function handleTuiSidebarCommandExecuteBefore(
  input: CommandInput,
  output: CommandOutput,
): Promise<void> {
  const command = COMMANDS[input.command];
  if (!command) return;

  const mode =
    command === 'toggle'
      ? getNextSidebarMode(readTuiSidebarState().mode)
      : command;
  const state = getSidebarStateForMode(mode);
  writeTuiSidebarState(state);

  output.parts.length = 0;
  output.parts.push(
    createInternalAgentTextPart(
      `Blacktower sidebar mode set to ${state.mode}. The TUI refreshes automatically.`,
    ),
  );
}

function getCommandDescription(command: string): string {
  if (command === 'board-toggle') {
    return 'Cycle the Blacktower sidebar between compact, minimal, and full.';
  }
  if (command === 'board-full')
    return 'Expand every Blacktower sidebar section.';
  if (command === 'board-compact') {
    return 'Show CORE and collapse custom Blacktower sidebar sections.';
  }
  if (command === 'board-minimal') {
    return 'Show only the Blacktower sidebar status summary.';
  }
  return 'Hide Blacktower sidebar board content.';
}
