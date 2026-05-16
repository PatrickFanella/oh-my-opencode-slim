import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import {
  type CommandTemplate,
  registerCommandTemplates,
} from '../command-registry';
import {
  activeLoopsForSession,
  bindUnclaimedLoops,
  completeLoopCycle,
  createLoop,
  detachSessionLoops,
  extractObserveResult,
  futureIso,
  getLoop,
  insertEvent,
  listEvents,
  listLoops,
  markLoopPending,
  nextDueLoop,
  type ObserveDbOptions,
  type ObserveLoopRow,
  openObserveDb,
  pendingLoopForSession,
  pruneObserveDb,
  pruneObserveDbWithCounts,
  resolveLoopForResult,
  stopLoops,
} from './db';
import {
  formatHistory,
  formatLoopList,
  formatPrune,
  formatSessionStatus,
  formatStartResult,
  formatStatus,
  formatStopResult,
  renderObservationResumeNote,
  renderObservationStateBlock,
} from './render';

const DEFAULT_INTERVAL = 30;
const DEFAULT_MAX_CYCLES = 10;
const DEFAULT_HISTORY_LIMIT = 10;

type ObserveClient = {
  session?: {
    prompt?: (input: {
      path: { id: string };
      body: { noReply: boolean; parts: Array<{ type: 'text'; text: string }> };
    }) => Promise<unknown>;
  };
};

type ObserveEventInput = {
  event: {
    type: string;
    properties?: {
      sessionID?: string;
      info?: { id?: string; sessionID?: string };
      part?: { type?: string; text?: string; synthetic?: boolean };
    };
  };
};

type ObserveSystemTransformInput = {
  sessionID?: string;
};

type ObserveSystemTransformOutput = {
  system: string[];
};

const OBSERVE_COMMAND_TEMPLATES: Record<string, CommandTemplate> = {
  'observe-start': {
    description: 'Start bounded observation loop for current session',
    template: [
      'Interpret `$ARGUMENTS` as: `<target> [interval-seconds] [success criteria...]`.',
      '',
      'Use the `observe_start` tool.',
      '',
      'Rules:',
      '',
      '- first token = target',
      '- second token, if numeric = `interval_secs`',
      '- remaining text = `success_criteria`',
      '- if interval missing, let tool default',
      '',
      'Reply with one short line containing loop ID, target, interval, and next check time if shown.',
    ].join('\n'),
  },
  'observe-stop': {
    description: 'Stop active observation loop',
    template: [
      'Interpret `$ARGUMENTS` as optional `<loop-id>` or `all`.',
      '',
      'Use the `observe_stop` tool.',
      '',
      'Reply with one short confirmation line.',
    ].join('\n'),
  },
  'observe-status': {
    description: 'Show current observation loop status',
    template: [
      'Interpret `$ARGUMENTS` as optional `<loop-id>`.',
      '',
      'Use the `observe_status` tool.',
      '',
      'Reply with a short status summary.',
    ].join('\n'),
  },
  'observe-list': {
    description: 'List observe loops for this project',
    template: [
      'Interpret `$ARGUMENTS` as optional `active|inactive|all [session] [limit]`.',
      '',
      'Rules:',
      '',
      '- if `session` present, set `session_only=true`',
      '- if numeric token present, use as `limit`',
      '',
      'Use the `observe_list` tool.',
      '',
      'Reply with active loops first.',
    ].join('\n'),
  },
  'observe-history': {
    description: 'Show recent observe loop history',
    template: [
      'Interpret `$ARGUMENTS` as `[loop-id] [limit]`.',
      '',
      'Rules:',
      '',
      '- if first token is numeric, treat it as `limit`',
      '- if second token is numeric, treat it as `limit`',
      '- otherwise first token = `loop_id`',
      '',
      'Use the `observe_history` tool.',
      '',
      'Reply with newest useful events first.',
    ].join('\n'),
  },
  'observe-prune': {
    description: 'Prune old observe loops and event history',
    template: [
      'Use the `observe_prune` tool.',
      '',
      'Reply with removed and remaining counts.',
    ].join('\n'),
  },
};

function sessionFromEvent(event: ObserveEventInput['event']): string | null {
  return event.properties?.sessionID ?? event.properties?.info?.id ?? null;
}

async function enqueueCyclePrompt(
  client: ObserveClient | undefined,
  sessionID: string,
  loop: ObserveLoopRow,
  reason: string,
): Promise<void> {
  if (!client?.session?.prompt) {
    return;
  }

  const text = [
    'Run one observe-and-tune cycle now.',
    `Loop ID: ${loop.id}.`,
    `Target: ${loop.target || 'unknown'}.`,
    `Success criteria: ${loop.success_criteria || 'not specified'}.`,
    `Cycle: ${Number(loop.cycle_count) + 1} of ${loop.max_cycles}.`,
    `Trigger: ${reason}.`,
    `Reply with a short summary and include a final line exactly in this format: <observe-result loop_id="${loop.id}" status="healthy|degraded|blocked|failed" summary="..." />.`,
  ].join(' ');

  await client.session.prompt({
    path: { id: sessionID },
    body: { noReply: false, parts: [{ type: 'text', text }] },
  });
}

async function injectResumeNote(
  client: ObserveClient | undefined,
  sessionID: string,
  loops: ObserveLoopRow[],
): Promise<void> {
  if (!client?.session?.prompt || loops.length === 0) {
    return;
  }

  await client.session.prompt({
    path: { id: sessionID },
    body: {
      noReply: true,
      parts: [{ type: 'text', text: renderObservationResumeNote(loops) }],
    },
  });
}

export function createObserveToolkit({
  directory,
  client,
  dbPath,
  baseConfigDir,
  legacyHistoryPath,
  legacyStatePath,
}: {
  directory: string;
  client?: ObserveClient;
  dbPath?: string;
  baseConfigDir?: string;
  legacyHistoryPath?: string;
  legacyStatePath?: string;
}): {
  tools: Record<string, ToolDefinition>;
  registerCommands: (opencodeConfig: Record<string, unknown>) => void;
  handleEvent: (input: ObserveEventInput) => Promise<void>;
  handleSystemTransform: (
    input: ObserveSystemTransformInput,
    output: ObserveSystemTransformOutput,
  ) => Promise<void>;
} {
  const dbOptions: ObserveDbOptions = {
    directory,
    dbPath,
    baseConfigDir,
    legacyHistoryPath,
    legacyStatePath,
  };
  const dbContext = openObserveDb(dbOptions);
  const { db } = dbContext;

  function registerCommands(opencodeConfig: Record<string, unknown>): void {
    registerCommandTemplates(opencodeConfig, OBSERVE_COMMAND_TEMPLATES);
  }

  async function handleEvent(input: ObserveEventInput): Promise<void> {
    try {
      const { event } = input;

      if (event.type === 'session.created') {
        const sessionID = sessionFromEvent(event);
        if (!sessionID) {
          return;
        }

        bindUnclaimedLoops(db, sessionID);

        const loops = activeLoopsForSession(db, sessionID);
        try {
          await injectResumeNote(client, sessionID, loops);
        } catch {
          // best effort
        }
        return;
      }

      if (event.type === 'session.deleted') {
        const sessionID = sessionFromEvent(event);
        if (sessionID) {
          detachSessionLoops(db, sessionID);
        }
        return;
      }

      if (event.type === 'session.compacted') {
        const sessionID = event.properties?.sessionID;
        if (!sessionID) {
          return;
        }
        const loops = activeLoopsForSession(db, sessionID);
        if (loops.length === 0) {
          return;
        }
        try {
          await injectResumeNote(client, sessionID, loops);
        } catch {
          // best effort
        }
        return;
      }

      if (event.type === 'session.idle') {
        const sessionID = event.properties?.sessionID;
        if (!sessionID) {
          return;
        }

        pruneObserveDb(db);
        if (pendingLoopForSession(db, sessionID)) {
          return;
        }

        const loop = nextDueLoop(db, sessionID);
        if (!loop) {
          return;
        }

        markLoopPending(db, loop.id, 'session.idle');
        insertEvent(db, {
          loopID: loop.id,
          type: 'enqueue',
          sessionID,
          summary: loop.target,
          details: { cycle: Number(loop.cycle_count) + 1 },
        });

        try {
          await enqueueCyclePrompt(
            client,
            sessionID,
            { ...loop, pending: 1 },
            'session.idle',
          );
        } catch {
          const failedAt = new Date().toISOString();
          db.query(
            `
            update loops
            set pending = 0,
                lock_expires_at = null,
                last_result = ?,
                last_summary = ?,
                last_trigger = ?,
                next_check_at = ?,
                updated_at = ?
            where id = ?
          `,
          ).run(
            'failed',
            'Could not enqueue observe cycle',
            'session.idle:enqueue-failed',
            futureIso(Number(loop.interval_secs)),
            failedAt,
            loop.id,
          );

          insertEvent(db, {
            loopID: loop.id,
            type: 'enqueue-failed',
            sessionID,
            result: 'failed',
            summary: 'Could not enqueue observe cycle',
            at: failedAt,
          });
        }
        return;
      }

      if (event.type === 'message.part.updated') {
        const sessionID = event.properties?.sessionID;
        const part = event.properties?.part;
        if (!sessionID || part?.type !== 'text' || part.synthetic) {
          return;
        }

        const result = extractObserveResult(part.text ?? '');
        if (!result?.status) {
          return;
        }

        const loop = resolveLoopForResult(db, sessionID, result.loopID);
        if (!loop) {
          return;
        }

        completeLoopCycle(db, loop, result);
      }
    } catch {
      // never crash plugin from observe hook
    }
  }

  async function handleSystemTransform(
    input: ObserveSystemTransformInput,
    output: ObserveSystemTransformOutput,
  ): Promise<void> {
    if (!input.sessionID) {
      return;
    }

    try {
      const loops = activeLoopsForSession(db, input.sessionID);
      if (loops.length === 0) {
        return;
      }

      output.system.push(renderObservationStateBlock(dbContext.dbPath, loops));
    } catch {
      // never crash plugin from system transform
    }
  }

  return {
    registerCommands,
    handleEvent,
    handleSystemTransform,
    tools: {
      observe_start: tool({
        description: 'Start bounded observation loop for current session.',
        args: {
          target: tool.schema.string(),
          interval_secs: tool.schema.number().int().min(5).optional(),
          success_criteria: tool.schema.string().optional(),
          max_cycles: tool.schema.number().int().min(1).optional(),
        },
        async execute(args, context) {
          const target = args.target.trim();
          const interval = args.interval_secs ?? DEFAULT_INTERVAL;
          const maxCycles = args.max_cycles ?? DEFAULT_MAX_CYCLES;
          const criteria = args.success_criteria?.trim() ?? '';

          const loop = createLoop(db, {
            sessionID: context.sessionID,
            target,
            intervalSecs: interval,
            maxCycles,
            successCriteria: criteria,
          });

          insertEvent(db, {
            loopID: loop.id,
            type: 'start',
            sessionID: context.sessionID,
            summary: target,
            details: { interval, maxCycles, criteria },
          });

          context.metadata({
            title: 'Observation started',
            metadata: { loop, dbPath: dbContext.dbPath },
          });

          return formatStartResult(loop);
        },
      }),

      observe_stop: tool({
        description: 'Stop active observation loop.',
        args: {
          loop_id: tool.schema.string().optional(),
          all: tool.schema.boolean().optional(),
        },
        async execute(args, context) {
          const loops = stopLoops(db, {
            sessionID: context.sessionID,
            all: args.all,
            loopID: args.loop_id,
          });

          context.metadata({
            title: 'Observation stopped',
            metadata: { count: loops.length, dbPath: dbContext.dbPath },
          });

          return formatStopResult(loops.length);
        },
      }),

      observe_status: tool({
        description: 'Show current observation status.',
        args: {
          loop_id: tool.schema.string().optional(),
        },
        async execute(args, context) {
          if (args.loop_id) {
            const loop = getLoop(db, args.loop_id);
            if (!loop) {
              throw new Error(`Unknown observe loop: ${args.loop_id}`);
            }

            const events = listEvents(db, {
              loopID: args.loop_id,
              limit: 5,
            }).reverse();

            context.metadata({
              title: 'Observation status',
              metadata: { loop, dbPath: dbContext.dbPath },
            });

            return formatStatus(loop, events);
          }

          const loops = activeLoopsForSession(db, context.sessionID);
          context.metadata({
            title: 'Observation status',
            metadata: { count: loops.length, dbPath: dbContext.dbPath },
          });
          return formatSessionStatus(loops);
        },
      }),

      observe_list: tool({
        description: 'List observe loops for this project.',
        args: {
          status: tool.schema.enum(['active', 'inactive', 'all']).optional(),
          session_only: tool.schema.boolean().optional(),
          limit: tool.schema.number().int().min(1).max(100).optional(),
        },
        async execute(args, context) {
          const loops = listLoops(db, {
            status: args.status ?? 'active',
            sessionOnly: Boolean(args.session_only),
            sessionID: context.sessionID,
            limit: args.limit ?? 20,
          });

          context.metadata({
            title: 'Observation list',
            metadata: { count: loops.length, dbPath: dbContext.dbPath },
          });

          return formatLoopList(loops);
        },
      }),

      observe_history: tool({
        description: 'Show recent observe history for a loop or session.',
        args: {
          loop_id: tool.schema.string().optional(),
          limit: tool.schema.number().int().min(1).max(100).optional(),
        },
        async execute(args, context) {
          const events = listEvents(db, {
            loopID: args.loop_id,
            sessionID: args.loop_id ? undefined : context.sessionID,
            limit: args.limit ?? DEFAULT_HISTORY_LIMIT,
          }).reverse();

          context.metadata({
            title: 'Observation history',
            metadata: {
              count: events.length,
              dbPath: dbContext.dbPath,
              loopID: args.loop_id ?? null,
            },
          });

          return formatHistory(events);
        },
      }),

      observe_prune: tool({
        description: 'Prune old observe loops/events and show retained counts.',
        args: {},
        async execute(_args, context) {
          const result = pruneObserveDbWithCounts(db);
          context.metadata({
            title: 'Observation prune',
            metadata: { ...result, dbPath: dbContext.dbPath },
          });
          return formatPrune(result);
        },
      }),
    },
  };
}
