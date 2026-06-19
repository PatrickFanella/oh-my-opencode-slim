import type { AgentName } from '../../config';
import {
  deriveTaskSessionLabel,
  type RememberedTaskSession,
  SessionManager,
} from '../../utils/session-manager';

export interface TaskArgs {
  description?: unknown;
  prompt?: unknown;
  subagent_type?: unknown;
  task_id?: unknown;
}

export interface DelegatedSessionMemoryRememberInput {
  parentSessionId: string;
  taskId: string;
  agentType: AgentName;
  label: string;
}

export interface DelegatedSessionMemoryResolveInput {
  parentSessionId: string;
  agentType: AgentName;
  taskId: string;
}

export interface DelegatedSessionMemoryEnrichInput {
  sessionID: string;
  tool: string;
  callID?: string;
  args?: unknown;
}

export interface DelegatedSessionMemoryPurgeInput {
  sessionID: string;
  status?: 'idle' | 'deleted' | 'other';
}

export interface DelegatedSessionMemoryResolvedTaskArgs {
  args: TaskArgs;
  pending: {
    parentSessionId: string;
    agentType: AgentName;
    label: string;
    prompt: string;
  } | null;
}

export function createDelegatedSessionMemory(
  options: {
    maxSessionsPerAgent: number;
    readContextMinLines?: number;
    readContextMaxFiles?: number;
  } = { maxSessionsPerAgent: 2 },
): {
  remember(input: DelegatedSessionMemoryRememberInput): RememberedTaskSession;
  resolve(
    input: DelegatedSessionMemoryResolveInput,
  ): RememberedTaskSession | undefined;
  enrich(
    input: DelegatedSessionMemoryEnrichInput,
  ): DelegatedSessionMemoryResolvedTaskArgs | undefined;
  purge(input: DelegatedSessionMemoryPurgeInput): void;
  formatForPrompt(sessionID: string): string | undefined;
  addContext(
    taskId: string,
    files: Parameters<SessionManager['addContext']>[1],
  ): void;
  taskIds(): Set<string>;
  clearParent(parentSessionId: string): void;
  dropTask(taskId: string): void;
} {
  const sessionManager = new SessionManager(options.maxSessionsPerAgent, {
    readContextMinLines: options.readContextMinLines,
    readContextMaxFiles: options.readContextMaxFiles,
  });

  return {
    remember(input) {
      return sessionManager.remember(input);
    },

    resolve(input) {
      const remembered = sessionManager.resolve(
        input.parentSessionId,
        input.agentType,
        input.taskId,
      );

      if (remembered) {
        sessionManager.markUsed(
          input.parentSessionId,
          input.agentType,
          remembered.taskId,
        );
      }

      return remembered;
    },

    enrich(input) {
      if (input.tool.toLowerCase() !== 'task') return undefined;
      if (!isTaskArgs(input.args)) return undefined;
      if (!isAgentName(input.args.subagent_type)) return undefined;

      const label = deriveTaskSessionLabel({
        description:
          typeof input.args.description === 'string'
            ? input.args.description
            : undefined,
        prompt:
          typeof input.args.prompt === 'string' ? input.args.prompt : undefined,
        agentType: input.args.subagent_type,
      });
      const prompt =
        typeof input.args.prompt === 'string' ? input.args.prompt : label;

      return {
        args: input.args,
        pending: {
          parentSessionId: input.sessionID,
          agentType: input.args.subagent_type,
          label,
          prompt,
        },
      };
    },

    purge(input) {
      sessionManager.dropTask(input.sessionID);
      sessionManager.clearParent(input.sessionID);
    },

    formatForPrompt(sessionID) {
      return sessionManager.formatForPrompt(sessionID);
    },

    addContext(taskId, files) {
      sessionManager.addContext(taskId, files);
    },

    taskIds() {
      return sessionManager.taskIds();
    },

    clearParent(parentSessionId) {
      sessionManager.clearParent(parentSessionId);
    },

    dropTask(taskId) {
      sessionManager.dropTask(taskId);
    },
  };
}

function isAgentName(value: unknown): value is AgentName {
  return (
    value === 'orchestrator' ||
    value === 'oracle' ||
    value === 'designer' ||
    value === 'explorer' ||
    value === 'librarian' ||
    value === 'fixer' ||
    value === 'observer' ||
    value === 'council' ||
    value === 'councillor'
  );
}

function isTaskArgs(value: unknown): value is TaskArgs {
  return typeof value === 'object' && value !== null;
}
