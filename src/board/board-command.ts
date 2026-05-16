import { createInternalAgentTextPart } from '../utils';
import type { BoardRuntime } from './board-runtime';

const COMMAND_NAME = 'board';
const USAGE = '/board status, /board roles, /board route <request>';

type CommandInput = {
  command: string;
  arguments: string;
};

type CommandOutput = {
  parts: Array<{ type: string; text?: string }>;
};

export function createBoardCommandManager(runtime: BoardRuntime) {
  function registerCommand(opencodeConfig: Record<string, unknown>): void {
    const configCommand = opencodeConfig.command as
      | Record<string, unknown>
      | undefined;

    if (!configCommand?.[COMMAND_NAME]) {
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }

      (opencodeConfig.command as Record<string, unknown>)[COMMAND_NAME] = {
        template: `Inspect Board Runtime. Usage: ${USAGE}`,
        description: 'Inspect Board Runtime status, roles, and routing.',
      };
    }
  }

  async function handleCommandExecuteBefore(
    input: CommandInput,
    output: CommandOutput,
  ): Promise<void> {
    if (input.command !== COMMAND_NAME) {
      return;
    }

    output.parts.length = 0;

    const args = input.arguments.trim();
    if (!args) {
      output.parts.push(createInternalAgentTextPart(formatStatus(runtime)));
      return;
    }

    const [subcommand, ...rest] = args.split(/\s+/);

    if (subcommand === 'help' || subcommand === 'status') {
      output.parts.push(createInternalAgentTextPart(formatStatus(runtime)));
      return;
    }

    if (subcommand === 'roles') {
      output.parts.push(createInternalAgentTextPart(formatRoles(runtime)));
      return;
    }

    if (subcommand === 'route') {
      const request = rest.join(' ').trim();
      if (!request) {
        output.parts.push(
          createInternalAgentTextPart('Usage: /board route <request>'),
        );
        return;
      }

      const record = runtime.route(request);
      output.parts.push(createInternalAgentTextPart(formatRoute(record)));
      return;
    }

    output.parts.push(
      createInternalAgentTextPart(
        `Unknown board command "${subcommand}". Usage: ${USAGE}`,
      ),
    );
  }

  return {
    registerCommand,
    handleCommandExecuteBefore,
  };
}

function formatStatus(runtime: BoardRuntime): string {
  const status = runtime.getStatus();
  const recentDecisions = runtime.getRecentDecisions().length;

  return [
    'Board Runtime',
    `enabled: ${status.enabled}`,
    `mode: ${status.mode}`,
    `council escalation: ${status.councilEscalation}`,
    `roles: ${status.roles.length}`,
    `recent decisions: ${recentDecisions}`,
  ].join('\n');
}

function formatRoles(runtime: BoardRuntime): string {
  const { roles } = runtime.getStatus();
  if (roles.length === 0) {
    return 'Board Roles\nNo roles configured.';
  }

  const sortedRoles = [...roles].sort((a, b) => a.id.localeCompare(b.id));

  return [
    'Board Roles',
    ...sortedRoles.map(
      (role) =>
        `${role.id}: ${role.title} -> @${role.agent} ` +
        `(priority ${role.priority})`,
    ),
  ].join('\n');
}

function formatRoute(record: ReturnType<BoardRuntime['route']>): string {
  const action =
    record.action.type === 'delegate'
      ? `delegate -> @${record.action.agent}`
      : record.action.type;
  const candidates =
    record.decision.candidates.length > 0
      ? record.decision.candidates.map((role) => role.id).join(', ')
      : 'none';

  return [
    'Board Route',
    `input: ${record.decision.input}`,
    `action: ${action}`,
    `reason: ${record.action.reason}`,
    `candidates: ${candidates}`,
  ].join('\n');
}

export type BoardCommandManager = ReturnType<typeof createBoardCommandManager>;
