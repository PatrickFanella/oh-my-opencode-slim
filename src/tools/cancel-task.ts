import {
  type PluginInput,
  type ToolDefinition,
  tool,
} from '@opencode-ai/plugin';
import type { BackgroundJobBoard, BackgroundJobRecord } from '../utils';
import {
  abortSessionWithTimeout,
  OperationTimeoutError,
  SESSION_ABORT_TIMEOUT_MS,
} from '../utils/session';

type OpenCodeClient = PluginInput['client'];

const TERMINAL_STATES = new Set([
  'completed',
  'failed',
  'cancelled',
  'reconciled',
]);

function getSessionID(context: unknown): string | undefined {
  if (!context || typeof context !== 'object' || !('sessionID' in context)) {
    return undefined;
  }
  const sessionID = (context as { sessionID?: unknown }).sessionID;
  return typeof sessionID === 'string' ? sessionID : undefined;
}

function getDirectory(context: unknown): string | undefined {
  if (!context || typeof context !== 'object' || !('directory' in context)) {
    return undefined;
  }
  const directory = (context as { directory?: unknown }).directory;
  return typeof directory === 'string' ? directory : undefined;
}

function formatKnownJobs(jobs: BackgroundJobRecord[]): string {
  if (jobs.length === 0)
    return 'No delegated tasks are tracked for this session.';
  return [
    'Known delegated tasks for this session:',
    ...jobs.map(
      (job) =>
        `- ${job.alias} (${job.taskID}) [${job.state}] ${job.agent}: ${job.description}`,
    ),
  ].join('\n');
}

function resolveJob(
  board: BackgroundJobBoard,
  parentSessionID: string,
  id: string,
): BackgroundJobRecord | undefined {
  const scoped = board.resolve(parentSessionID, id);
  if (scoped) return scoped;

  const raw = board.get(id);
  if (raw?.parentSessionID === parentSessionID) return raw;

  return undefined;
}

export function createCancelTaskTool(options: {
  client: OpenCodeClient;
  backgroundJobBoard: BackgroundJobBoard;
  abortTimeoutMs?: number;
}): ToolDefinition {
  const z = tool.schema;

  return tool({
    description:
      'Cancel a tracked delegated OpenCode task session by Background Jobs alias or raw task/session ID. Does not roll back file edits already made by the worker.',
    args: {
      id: z
        .string()
        .describe('Background Jobs alias or raw task/session ID to cancel'),
    },
    async execute(args, context) {
      const parentSessionID = getSessionID(context);
      if (!parentSessionID) {
        return 'Cannot cancel delegated task: missing current session ID.';
      }

      const id = args.id.trim();
      if (!id) {
        return 'Cannot cancel delegated task: provide a Background Jobs alias or task/session ID.';
      }

      const job = resolveJob(options.backgroundJobBoard, parentSessionID, id);
      if (!job) {
        return [
          `No tracked delegated task matched "${id}" in this session.`,
          formatKnownJobs(
            options.backgroundJobBoard.listForParent(parentSessionID),
          ),
        ].join('\n\n');
      }

      if (TERMINAL_STATES.has(job.state)) {
        return `Delegated task ${job.alias} (${job.taskID}) is already ${job.state}; no cancellation was sent.`;
      }

      options.backgroundJobBoard.markCancellationRequested(job.taskID);

      try {
        await abortSessionWithTimeout(
          options.client,
          job.taskID,
          options.abortTimeoutMs ?? SESSION_ABORT_TIMEOUT_MS,
          { directory: getDirectory(context) },
        );
        options.backgroundJobBoard.updateState(job.taskID, 'cancelled', {
          terminalUnreconciled: false,
        });
        return [
          `Cancellation sent for delegated task ${job.alias} (${job.taskID}).`,
          'This only stops the worker session; inspect the working tree for partial writes because cancellation does not roll back file changes.',
        ].join('\n');
      } catch (error) {
        options.backgroundJobBoard.updateState(job.taskID, 'unknown', {
          statusUncertain: true,
          lastError: error instanceof Error ? error.message : String(error),
        });
        const timedOut = error instanceof OperationTimeoutError;
        return [
          `Cancellation ${timedOut ? 'timed out' : 'failed'} for delegated task ${job.alias} (${job.taskID}).`,
          'The task status is uncertain; it may still stop later. Inspect the session and working tree before continuing.',
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        ].join('\n');
      }
    },
  });
}
