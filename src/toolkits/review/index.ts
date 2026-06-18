import { join } from 'node:path';
import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import { withTimeout } from '../../utils/session';
import {
  type CommandTemplate,
  registerCommandTemplates,
} from '../command-registry';
import {
  assertShellRunner,
  runShell,
  type ShellRunner,
  shellEscape,
} from '../github/helpers';
import {
  classifyChangedFiles,
  findCoverageGaps,
  findDeadExports,
  recommendReviewTools,
  summarizeComplexitySignals,
  summarizeLargeFiles,
} from './analyzers';
import { getChangedFiles } from './git';
import {
  fingerprint,
  loadReviewState,
  type ReviewStateOptions,
  saveReviewState,
} from './state';

type ReviewClient = {
  session?: {
    prompt?: (input: {
      path: { id: string };
      body: { noReply: boolean; parts: Array<{ type: 'text'; text: string }> };
    }) => Promise<unknown>;
  };
};

type ReviewEventInput = {
  event: {
    type: string;
    properties?: {
      sessionID?: string;
      info?: { sessionID?: string; id?: string };
    };
  };
};

const REVIEW_COMMAND_TEMPLATES: Record<string, CommandTemplate> = {
  'review-auto': {
    description: 'Enable, disable, or inspect automatic review reminders',
    template:
      'Interpret `$ARGUMENTS` as optional `on|off|status` and use the `review_auto` tool.',
  },
  'review-auto-off': {
    description: 'Disable automatic review reminders',
    template: 'Use the `review_auto` tool with mode `off`.',
  },
  'review-auto-on': {
    description: 'Enable automatic review reminders',
    template: 'Use the `review_auto` tool with mode `on`.',
  },
  'review-auto-status': {
    description: 'Inspect automatic review reminder status',
    template: 'Use the `review_auto` tool with mode `status`.',
  },
  'review-changed-files': {
    description: 'Summarize changed files and risk buckets',
    template:
      'Treat `$ARGUMENTS` as optional base ref and use the `review_changed_files` tool.',
  },
  'review-complexity': {
    description: 'Surface complexity hotspots',
    template:
      'Interpret `$ARGUMENTS` as optional `path`, `scope=changed|all`, and `base=<ref>`. Use the `review_complexity` tool.',
  },
  'review-coverage-gaps': {
    description: 'Find source files with no nearby tests',
    template:
      'Interpret `$ARGUMENTS` as optional `scope=changed|all` and `base=<ref>`. Use the `review_coverage_gaps` tool.',
  },
  'review-dead-exports': {
    description: 'Find exported symbols with no obvious imports',
    template:
      'Interpret `$ARGUMENTS` as optional `path`, `scope=changed|all`, and `base=<ref>`. Use the `review_dead_exports` tool.',
  },
  'review-diff': {
    description: 'Show staged and unstaged diff with stats',
    template:
      'Treat `$ARGUMENTS` as optional base ref and use the `review_diff` tool.',
  },
  'review-pr-ready': {
    description: 'Show merge-readiness summary',
    template:
      'Treat `$ARGUMENTS` as optional base ref and use the `review_pr_ready` tool.',
  },
  'review-search': {
    description: 'Search repo with review-friendly context windows',
    template:
      'Treat `$ARGUMENTS` as search pattern and use the `review_search` tool.',
  },
  'review-summary': {
    description: 'Run single-shot review summary',
    template:
      'Interpret `$ARGUMENTS` as optional `base=<ref>` and `scope=changed|all`, then use the `review_summary` tool.',
  },
  'review-todos': {
    description: 'Scan TODO/FIXME/HACK/XXX markers',
    template: 'Use the `review_todos` tool.',
  },
};

function resolveShellRunner($: unknown): ShellRunner {
  try {
    return assertShellRunner($);
  } catch {
    throw new Error('Review toolkit requires OpenCode shell runner.');
  }
}

export function createReviewToolkit({
  $,
  directory,
  client,
  state,
}: {
  $: unknown;
  directory: string;
  client?: ReviewClient;
  state?: ReviewStateOptions;
}): {
  registerCommands: (opencodeConfig: Record<string, unknown>) => void;
  tools: Record<string, ToolDefinition>;
  handleEvent: (input: ReviewEventInput) => Promise<void>;
} {
  const shellRunner = resolveShellRunner($);

  function registerCommands(opencodeConfig: Record<string, unknown>): void {
    registerCommandTemplates(opencodeConfig, REVIEW_COMMAND_TEMPLATES);
  }

  async function handleEvent(input: ReviewEventInput): Promise<void> {
    if (input.event.type !== 'session.idle') {
      return;
    }

    const reviewState = loadReviewState(state);
    if (!reviewState.autoReview) {
      return;
    }

    const diff = await runShell(
      shellRunner,
      "git diff --name-only && printf '\n' && git diff --cached --name-only",
    );
    const trimmedDiff = diff.trim();
    if (!trimmedDiff) {
      return;
    }

    const currentFingerprint = fingerprint(trimmedDiff);
    if (reviewState.lastNotifiedFingerprint === currentFingerprint) {
      return;
    }

    const sessionID =
      input.event.properties?.sessionID ??
      input.event.properties?.info?.sessionID ??
      input.event.properties?.info?.id;
    if (!sessionID || !client?.session?.prompt) {
      return;
    }

    try {
      await withTimeout(
        client.session.prompt({
          path: { id: sessionID },
          body: {
            noReply: true,
            parts: [
              {
                type: 'text',
                text: `<review-summary>Changed files detected. Run review_changed_files, review_summary, or review_pr_ready before finalizing. Files:\n${trimmedDiff}\n</review-summary>`,
              },
            ],
          },
        }),
        5_000,
        'Review notification timed out after 5000ms',
      );

      reviewState.lastNotifiedAt = new Date().toISOString();
      reviewState.lastNotifiedFingerprint = currentFingerprint;
      saveReviewState(reviewState, state);
    } catch {
      // best effort only
    }
  }

  return {
    registerCommands,
    handleEvent,
    tools: {
      review_diff: tool({
        description: 'Show staged and unstaged diff with summary stats.',
        args: {
          base: tool.schema.string().optional().describe('Optional base ref'),
        },
        async execute(args, context) {
          const output = args.base
            ? await runShell(
                shellRunner,
                `git diff --stat ${shellEscape(args.base)}...HEAD && printf '\n' && git diff ${shellEscape(args.base)}...HEAD`,
              )
            : await runShell(
                shellRunner,
                "git diff --stat && printf '\n' && git diff && printf '\n\n-- staged --\n' && git diff --cached --stat && printf '\n' && git diff --cached",
              );

          context.metadata({
            title: 'Review diff',
            metadata: { base: args.base ?? null },
          });
          return output || 'No diff.';
        },
      }),

      review_todos: tool({
        description: 'Scan repo for TODO, FIXME, HACK, and XXX markers.',
        args: {},
        async execute(_args, context) {
          const output = await runShell(
            shellRunner,
            "rg -n --hidden --glob '!.git' --glob '!node_modules' --glob '!dist' --glob '!build' 'TODO|FIXME|HACK|XXX'",
          );
          context.metadata({ title: 'Review todos' });
          return output || 'No TODO-like markers found.';
        },
      }),

      review_complexity: tool({
        description: 'Surface long files and coarse complexity hotspots.',
        args: {
          path: tool.schema.string().optional().describe('Optional subtree'),
          scope: tool.schema
            .enum(['changed', 'all'])
            .optional()
            .describe('Analyze changed files or whole repo'),
          base: tool.schema
            .string()
            .optional()
            .describe('Optional base ref for changed scope'),
        },
        async execute(args, context) {
          const changed =
            args.scope === 'changed'
              ? await getChangedFiles(shellRunner, directory, args.base)
              : null;
          const selectedFiles = changed?.length
            ? changed.map((rel) => join(directory, rel))
            : undefined;

          const largeFiles = summarizeLargeFiles(directory, args.path);
          const scored = summarizeComplexitySignals(
            directory,
            selectedFiles ?? args.path,
          ).slice(0, 25);

          const nesting = await runShell(
            shellRunner,
            `rg -n --hidden --glob '!.git' --glob '!node_modules' --glob '!dist' --glob '!build' 'if .*if|for .*for|while .*while|\\? .*:' ${args.path ? shellEscape(args.path) : '.'}`,
          );

          context.metadata({
            title: 'Review complexity',
            metadata: {
              path: args.path ?? '.',
              scope: args.scope ?? 'all',
              base: args.base ?? null,
            },
          });

          return [
            'Large files:',
            largeFiles.length ? largeFiles.join('\n') : 'none',
            '',
            'Scored hotspots:',
            scored.length ? scored.join('\n') : 'none',
            '',
            'Potential nesting hotspots:',
            nesting || 'none',
          ].join('\n');
        },
      }),

      review_dead_exports: tool({
        description: 'Find exported symbols with no obvious imports.',
        args: {
          path: tool.schema.string().optional().describe('Optional subtree'),
          scope: tool.schema
            .enum(['changed', 'all'])
            .optional()
            .describe('Analyze changed files or whole repo'),
          base: tool.schema
            .string()
            .optional()
            .describe('Optional base ref for changed scope'),
        },
        async execute(args, context) {
          const changed =
            args.scope === 'changed'
              ? await getChangedFiles(shellRunner, directory, args.base)
              : null;
          const selectedFiles = changed?.length
            ? changed.map((rel) => join(directory, rel))
            : undefined;

          const output = findDeadExports(
            directory,
            selectedFiles ?? args.path,
          ).join('\n');

          context.metadata({
            title: 'Review dead exports',
            metadata: {
              path: args.path ?? '.',
              scope: args.scope ?? 'all',
              base: args.base ?? null,
            },
          });

          return output || 'No obvious dead exports found.';
        },
      }),

      review_search: tool({
        description: 'Search with small context windows for review work.',
        args: {
          pattern: tool.schema.string().describe('Pattern to search'),
        },
        async execute(args, context) {
          const output = await runShell(
            shellRunner,
            `rg -n -C 3 --hidden --glob '!.git' --glob '!node_modules' --glob '!dist' --glob '!build' ${shellEscape(args.pattern)}`,
          );
          context.metadata({
            title: 'Review search',
            metadata: { pattern: args.pattern },
          });
          return output || 'No matches found.';
        },
      }),

      review_coverage_gaps: tool({
        description: 'Find source files with no nearby test file.',
        args: {
          scope: tool.schema
            .enum(['changed', 'all'])
            .optional()
            .describe('Analyze changed files or whole repo'),
          base: tool.schema
            .string()
            .optional()
            .describe('Optional base ref for changed scope'),
        },
        async execute(args, context) {
          const changed =
            args.scope === 'changed'
              ? await getChangedFiles(shellRunner, directory, args.base)
              : null;
          const output = findCoverageGaps(directory, changed ?? undefined).join(
            '\n',
          );

          context.metadata({
            title: 'Review coverage gaps',
            metadata: {
              scope: args.scope ?? 'all',
              base: args.base ?? null,
            },
          });

          return output || 'No obvious coverage gaps found.';
        },
      }),

      review_changed_files: tool({
        description:
          'Summarize changed files, risk buckets, and suggested review tools.',
        args: {
          base: tool.schema.string().optional().describe('Optional base ref'),
        },
        async execute(args, context) {
          const changed = await getChangedFiles(
            shellRunner,
            directory,
            args.base,
          );
          const buckets = classifyChangedFiles(changed);
          const tools = recommendReviewTools(buckets);

          context.metadata({
            title: 'Review changed files',
            metadata: {
              base: args.base ?? null,
              count: changed.length,
              buckets,
              tools,
            },
          });

          return [
            `Changed files: ${changed.length}`,
            changed.length ? changed.join('\n') : 'none',
            '',
            `Code: ${buckets.code.length}`,
            `Tests: ${buckets.tests.length}`,
            `Docs: ${buckets.docs.length}`,
            `Config: ${buckets.config.length}`,
            '',
            `Suggested tools: ${tools.join(', ')}`,
          ].join('\n');
        },
      }),

      review_auto: tool({
        description: 'Enable, disable, or inspect automatic review reminders.',
        args: {
          mode: tool.schema
            .enum(['on', 'off', 'status'])
            .optional()
            .describe('Set auto-review on/off or inspect status'),
        },
        async execute(args, context) {
          const reviewState = loadReviewState(state);
          const mode = args.mode ?? 'status';

          if (mode === 'on') {
            reviewState.autoReview = true;
          }
          if (mode === 'off') {
            reviewState.autoReview = false;
          }

          saveReviewState(reviewState, state);
          context.metadata({
            title: 'Review auto mode',
            metadata: reviewState,
          });

          return `Auto-review ${reviewState.autoReview ? 'on' : 'off'}.`;
        },
      }),

      review_summary: tool({
        description:
          'Single-shot review summary with diff, todos, and hotspots.',
        args: {
          base: tool.schema.string().optional().describe('Optional base ref'),
          scope: tool.schema
            .enum(['changed', 'all'])
            .optional()
            .describe('Analyze changed files or whole repo'),
        },
        async execute(args, context) {
          const diff = args.base
            ? await runShell(
                shellRunner,
                `git diff --stat ${shellEscape(args.base)}...HEAD && printf '\n' && git diff ${shellEscape(args.base)}...HEAD`,
              )
            : await runShell(
                shellRunner,
                "git diff --stat && printf '\n' && git diff --cached --stat",
              );

          const changed =
            args.scope === 'changed' || args.base
              ? await getChangedFiles(shellRunner, directory, args.base)
              : null;

          const todos = await runShell(
            shellRunner,
            "rg -n --hidden --glob '!.git' --glob '!node_modules' --glob '!dist' --glob '!build' 'TODO|FIXME|HACK|XXX'",
          );

          const selectedFiles = changed?.length
            ? changed.map((rel) => join(directory, rel))
            : undefined;

          const hotspots = summarizeComplexitySignals(
            directory,
            selectedFiles ?? undefined,
          )
            .slice(0, 15)
            .join('\n');
          const gaps = findCoverageGaps(directory, changed ?? undefined)
            .slice(0, 20)
            .join('\n');
          const exports = findDeadExports(directory, selectedFiles ?? undefined)
            .slice(0, 20)
            .join('\n');

          context.metadata({
            title: 'Review summary',
            metadata: {
              base: args.base ?? null,
              scope: args.scope ?? (args.base ? 'changed' : 'all'),
            },
          });

          return [
            'Diff:',
            diff || 'none',
            '',
            'TODOs:',
            todos || 'none',
            '',
            'Hotspots:',
            hotspots || 'none',
            '',
            'Coverage gaps:',
            gaps || 'none',
            '',
            'Possible dead exports:',
            exports || 'none',
          ].join('\n');
        },
      }),

      review_pr_ready: tool({
        description:
          'High-signal merge-readiness summary for current worktree or branch diff.',
        args: {
          base: tool.schema.string().optional().describe('Optional base ref'),
        },
        async execute(args, context) {
          const changed = await getChangedFiles(
            shellRunner,
            directory,
            args.base,
          );
          const buckets = classifyChangedFiles(changed);

          const diff = args.base
            ? await runShell(
                shellRunner,
                `git diff --stat ${shellEscape(args.base)}...HEAD`,
              )
            : await runShell(
                shellRunner,
                "git diff --stat && printf '\n' && git diff --cached --stat",
              );

          const changedPaths = changed.map((rel) => join(directory, rel));
          const hotspots = summarizeComplexitySignals(
            directory,
            changedPaths,
          ).slice(0, 10);
          const gaps = findCoverageGaps(directory, changed).slice(0, 10);
          const exports = findDeadExports(directory, changedPaths).slice(0, 10);

          const risk =
            hotspots.length > 0 || gaps.length > 0 || exports.length > 0
              ? 'with fixes'
              : 'ready';

          context.metadata({
            title: 'Review PR ready',
            metadata: {
              base: args.base ?? null,
              changed: changed.length,
              risk,
              buckets,
            },
          });

          return [
            `Verdict: ${risk}`,
            `Changed files: ${changed.length}`,
            diff || 'No diff.',
            '',
            `Risk buckets: code=${buckets.code.length}, tests=${buckets.tests.length}, docs=${buckets.docs.length}, config=${buckets.config.length}`,
            `Hotspots: ${hotspots.length ? hotspots.join(' | ') : 'none'}`,
            `Coverage gaps: ${gaps.length ? gaps.join(' | ') : 'none'}`,
            `Possible dead exports: ${exports.length ? exports.join(' | ') : 'none'}`,
          ].join('\n');
        },
      }),
    },
  };
}
