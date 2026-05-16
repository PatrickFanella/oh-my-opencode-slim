import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import {
  type CommandTemplate,
  registerCommandTemplates,
} from '../command-registry';
import { type CavemanMode, DEFAULT_MODE, listModes } from './modes';
import { buildModePrompt, RESUME_REGEX, STOP_REGEX } from './prompts';
import {
  type CavemanStateOptions,
  clearSessionMode,
  currentStatus,
  getSessionMode,
  loadState,
  removeSession,
  setDefaultMode,
  setSessionMode,
  writeFlag,
} from './state';

type CavemanEventInput = {
  event: {
    type: string;
    properties?: {
      sessionID?: string;
      info?: { sessionID?: string; id?: string };
    };
  };
};

type CavemanChatInput = {
  sessionID: string;
};

type CavemanChatOutput = unknown;

type CavemanSystemTransformInput = {
  sessionID?: string;
};

type CavemanSystemTransformOutput = {
  system: string[];
};

type TextPart = {
  type: string;
  text?: string;
};

const CAVEMAN_COMMAND_TEMPLATES: Record<string, CommandTemplate> = {
  caveman: {
    description: 'Set caveman mode, default, or status',
    template: [
      'Interpret `$ARGUMENTS` as a caveman control command and use the `caveman_mode` tool.',
      '',
      'Rules:',
      '',
      '- no args => action `set`, mode `ultra`',
      '- `lite|full|ultra|wenyan-lite|wenyan|wenyan-ultra|commit|review` => action `set`',
      '- `off|normal|stop` => action `set`, mode `normal`',
      '- `status` => action `get`',
      '- `clear` => action `clear`',
      '- `default <mode>` => action `set-default`',
      '- `default reset` => action `reset-default`',
      '- `list` or `help` => action `list`',
      '',
      'After the tool call, reply in one short line with the active session mode and default.',
    ].join('\n'),
  },
  'caveman-status': {
    description: 'Show current caveman session mode',
    template: [
      'Use the `caveman_mode` tool with action `get`.',
      '',
      'Reply with one short status line.',
    ].join('\n'),
  },
  'caveman-commit': {
    description: 'Switch this session to caveman commit mode',
    template: [
      'Use the `caveman_mode` tool to set this session to `commit` mode.',
      '',
      'Reply with one short confirmation line.',
    ].join('\n'),
  },
  'caveman-review': {
    description: 'Switch this session to caveman review mode',
    template: [
      'Use the `caveman_mode` tool to set this session to `review` mode.',
      '',
      'Reply with one short confirmation line.',
    ].join('\n'),
  },
  'caveman-compress': {
    description: 'Compress a prose-heavy file into caveman format',
    template: [
      'Compress the file at `$ARGUMENTS` into caveman format.',
      '',
      'Requirements:',
      '',
      '- If `$ARGUMENTS` is empty, ask for a file path.',
      '- Only compress prose-heavy natural language files.',
      '- Preserve headings, code blocks, inline code, URLs, commands, file paths, env vars, dates, version numbers, and numeric values exactly.',
      '- Create a backup beside the file named `<original-stem>.original.md` before overwriting.',
      '- If the backup already exists, stop and ask before changing anything.',
      '- Overwrite the original only after the compressed content is ready.',
      '- If the target is code/config instead of prose, refuse and explain briefly.',
      '',
      'Use clear prose for any risk or ambiguity. Otherwise stay terse.',
    ].join('\n'),
  },
};

function extractText(parts: unknown): string {
  if (!Array.isArray(parts)) {
    return '';
  }

  return (parts as TextPart[])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function getOutputText(output: CavemanChatOutput): string {
  const value =
    output && typeof output === 'object'
      ? (output as {
          parts?: unknown;
          message?: { parts?: unknown; content?: unknown; text?: unknown };
        })
      : undefined;

  const fromOutputParts = extractText(value?.parts);
  if (fromOutputParts) {
    return fromOutputParts;
  }

  const fromMessageParts = extractText(value?.message?.parts);
  if (fromMessageParts) {
    return fromMessageParts;
  }

  if (typeof value?.message?.content === 'string') {
    return value.message.content.trim();
  }

  if (typeof value?.message?.text === 'string') {
    return value.message.text.trim();
  }

  return '';
}

export function createCavemanToolkit({
  state,
}: {
  state?: CavemanStateOptions;
} = {}): {
  registerCommands: (opencodeConfig: Record<string, unknown>) => void;
  tools: Record<string, ToolDefinition>;
  handleEvent: (input: CavemanEventInput) => Promise<void>;
  handleChatMessage: (
    input: CavemanChatInput,
    output: CavemanChatOutput,
  ) => Promise<void>;
  handleSystemTransform: (
    input: CavemanSystemTransformInput,
    output: CavemanSystemTransformOutput,
  ) => Promise<void>;
} {
  function registerCommands(opencodeConfig: Record<string, unknown>): void {
    registerCommandTemplates(opencodeConfig, CAVEMAN_COMMAND_TEMPLATES);
  }

  async function handleEvent(input: CavemanEventInput): Promise<void> {
    if (input.event.type === 'session.created') {
      const defaultMode = loadState(state).defaultMode;
      writeFlag(defaultMode, state);
      return;
    }

    if (input.event.type === 'session.deleted') {
      const sessionID =
        input.event.properties?.sessionID ?? input.event.properties?.info?.id;
      if (sessionID) {
        removeSession(sessionID, state);
      }
    }
  }

  async function handleChatMessage(
    input: CavemanChatInput,
    output: CavemanChatOutput,
  ): Promise<void> {
    const text = getOutputText(output);
    if (!text) {
      return;
    }

    if (STOP_REGEX.test(text)) {
      setSessionMode(input.sessionID, 'normal', state);
      return;
    }

    if (RESUME_REGEX.test(text)) {
      const defaultMode = loadState(state).defaultMode;
      setSessionMode(input.sessionID, defaultMode, state);
    }
  }

  async function handleSystemTransform(
    input: CavemanSystemTransformInput,
    output: CavemanSystemTransformOutput,
  ): Promise<void> {
    const currentState = loadState(state);
    const mode = getSessionMode(currentState, input.sessionID);
    writeFlag(mode, state);

    const prompt = buildModePrompt(mode);
    if (prompt) {
      output.system.push(prompt);
    }
  }

  return {
    registerCommands,
    handleEvent,
    handleChatMessage,
    handleSystemTransform,
    tools: {
      caveman_mode: tool({
        description:
          'Manage caveman mode for the current OpenCode session or global default.',
        args: {
          action: tool.schema.enum([
            'get',
            'set',
            'clear',
            'set-default',
            'reset-default',
            'list',
          ]),
          mode: tool.schema
            .enum([
              'normal',
              'lite',
              'full',
              'ultra',
              'wenyan-lite',
              'wenyan',
              'wenyan-ultra',
              'commit',
              'review',
            ])
            .optional(),
        },
        async execute(args, context) {
          const sessionID = context.sessionID;

          switch (args.action) {
            case 'list': {
              context.metadata({ title: 'Caveman modes' });
              return `Modes: ${listModes().join(', ')}`;
            }
            case 'reset-default': {
              const defaultMode = setDefaultMode(DEFAULT_MODE, state);
              const status = currentStatus(sessionID, state);
              context.metadata({
                title: 'Reset caveman default',
                metadata: status,
              });
              return `Default ${defaultMode}. Session ${status.mode}.`;
            }
            case 'set-default': {
              if (!args.mode) {
                throw new Error('mode required for set-default');
              }

              const defaultMode = setDefaultMode(args.mode, state);
              const status = currentStatus(sessionID, state);
              context.metadata({
                title: 'Set caveman default',
                metadata: status,
              });
              return `Default ${defaultMode}. Session ${status.mode}.`;
            }
            case 'clear': {
              const status = clearSessionMode(sessionID, state);
              context.metadata({
                title: 'Clear caveman session override',
                metadata: status,
              });
              return `Session inherits default. Active ${status.mode}. Default ${status.defaultMode}.`;
            }
            case 'set': {
              if (!args.mode) {
                throw new Error('mode required for set');
              }

              const status = setSessionMode(
                sessionID,
                args.mode as CavemanMode,
                state,
              );
              context.metadata({
                title: 'Set caveman session mode',
                metadata: status,
              });
              return `Session ${status.mode}. Default ${status.defaultMode}.`;
            }
            case 'get': {
              const status = currentStatus(sessionID, state);
              context.metadata({ title: 'Caveman status', metadata: status });
              return `Session ${status.mode}${status.inherited ? ' (inherits default)' : ''}. Default ${status.defaultMode}.`;
            }
          }
        },
      }),
    },
  };
}
