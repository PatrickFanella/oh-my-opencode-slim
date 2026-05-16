import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import type { ShellRunner } from './helpers';
import { runShell, shellEscape } from './helpers';

export function createPrWorkflowTools({
  $,
}: {
  $: ShellRunner;
}): Record<string, ToolDefinition> {
  return {
    gh_review_queue: tool({
      description: 'List open pull requests likely needing review attention.',
      args: {},
      async execute(_args, context) {
        const output = await runShell(
          $,
          'gh pr list --state open --json number,title,isDraft,reviewDecision,statusCheckRollup,updatedAt,author --jq \'.[] | select((.isDraft|not) and (.reviewDecision != "APPROVED")) | "#" + (.number|tostring) + " " + .title + " | @" + .author.login + " | review=" + (.reviewDecision // "none") + " | updated=" + .updatedAt\'',
        );
        context.metadata({ title: 'Review queue' });
        return output || 'No open PRs needing review attention.';
      },
    }),

    gh_changed_files: tool({
      description: 'List files changed against main or master.',
      args: {},
      async execute(_args, context) {
        const output = await runShell(
          $,
          'base=$(git rev-parse --verify origin/main >/dev/null 2>&1 && printf origin/main || (git rev-parse --verify main >/dev/null 2>&1 && printf main || (git rev-parse --verify origin/master >/dev/null 2>&1 && printf origin/master || printf master))); git diff --name-only "$base"...HEAD',
        );
        context.metadata({ title: 'Changed files' });
        return output || 'No changed files against main/master.';
      },
    }),

    gh_ci_status: tool({
      description: 'Show CI status for current branch or ref.',
      args: {
        ref: tool.schema.string().optional().describe('Git ref or branch'),
      },
      async execute(args, context) {
        const ref = args.ref ? shellEscape(args.ref) : '';
        const output = await runShell($, `gh pr checks ${ref || ''}`);

        context.metadata({
          title: 'CI status',
          metadata: { ref: args.ref || 'current' },
        });

        return output || 'No CI status available.';
      },
    }),
  };
}
