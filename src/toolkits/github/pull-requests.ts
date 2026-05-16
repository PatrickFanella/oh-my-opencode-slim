import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import type { ShellRunner } from './helpers';
import {
  optionalFlag,
  repoFlag,
  resolvePrSelector,
  runShell,
  shellEscape,
} from './helpers';

export function createPullRequestTools({
  $,
}: {
  $: ShellRunner;
}): Record<string, ToolDefinition> {
  return {
    gh_pr_diff: tool({
      description: 'Get diff for a GitHub pull request.',
      args: {
        pr_number: tool.schema
          .number()
          .int()
          .min(1)
          .describe('Pull request number'),
      },
      async execute(args, context) {
        const output = await runShell($, `gh pr diff ${args.pr_number}`);
        context.metadata({
          title: 'PR diff',
          metadata: { pr: args.pr_number },
        });
        return output || `No diff output for PR ${args.pr_number}.`;
      },
    }),

    gh_pr_comments: tool({
      description: 'Get review comments grouped for a PR.',
      args: {
        pr_number: tool.schema
          .number()
          .int()
          .min(1)
          .describe('Pull request number'),
      },
      async execute(args, context) {
        const output = await runShell(
          $,
          `gh pr view ${args.pr_number} --comments`,
        );
        context.metadata({
          title: 'PR comments',
          metadata: { pr: args.pr_number },
        });
        return output || `No comments for PR ${args.pr_number}.`;
      },
    }),

    gh_pr_comment: tool({
      description: 'Add a general comment to a pull request.',
      args: {
        pr_number: tool.schema
          .number()
          .int()
          .min(1)
          .describe('Pull request number'),
        body: tool.schema.string().describe('Comment body'),
        repo: tool.schema.string().optional().describe('Optional owner/repo'),
      },
      async execute(args, context) {
        const output = await runShell(
          $,
          `gh pr comment ${args.pr_number} --body ${shellEscape(args.body)}${repoFlag(args.repo)}`,
        );
        context.metadata({
          title: 'PR comment',
          metadata: { pr: args.pr_number, repo: args.repo || 'current' },
        });
        return output || `Commented on PR #${args.pr_number}.`;
      },
    }),

    gh_pr_review: tool({
      description: 'Approve, comment on, or request changes on a PR.',
      args: {
        pr_number: tool.schema
          .number()
          .int()
          .min(1)
          .describe('Pull request number'),
        action: tool.schema
          .enum(['approve', 'comment', 'request-changes'])
          .describe('Review action'),
        body: tool.schema.string().optional().describe('Optional review body'),
        repo: tool.schema.string().optional().describe('Optional owner/repo'),
      },
      async execute(args, context) {
        const actionFlag =
          args.action === 'approve'
            ? '--approve'
            : args.action === 'request-changes'
              ? '--request-changes'
              : '--comment';

        const output = await runShell(
          $,
          `gh pr review ${args.pr_number} ${actionFlag}${optionalFlag('--body', args.body)}${repoFlag(args.repo)}`,
        );

        context.metadata({
          title: 'PR review',
          metadata: {
            pr: args.pr_number,
            action: args.action,
            repo: args.repo || 'current',
          },
        });

        return output || `${args.action} sent for PR #${args.pr_number}.`;
      },
    }),

    gh_pr_context: tool({
      description:
        'Show current branch PR context including checks, files, and comments summary.',
      args: {
        pr_number: tool.schema
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            'Optional pull request number; defaults to current branch PR',
          ),
      },
      async execute(args, context) {
        const selector = await resolvePrSelector($, args.pr_number);
        if (!selector) {
          context.metadata({ title: 'PR context', metadata: { pr: null } });
          return 'No PR found for current branch.';
        }

        const pr = await runShell(
          $,
          `gh pr view ${selector} --json number,title,state,isDraft,headRefName,baseRefName,author,reviewDecision`,
        );
        const checks = await runShell($, `gh pr checks ${selector}`);
        const files = await runShell(
          $,
          `gh pr view ${selector} --json files --jq '.files[].path'`,
        );
        const comments = await runShell($, `gh pr view ${selector} --comments`);

        context.metadata({ title: 'PR context', metadata: { pr: selector } });

        return [
          'PR:',
          pr || 'none',
          '',
          'Checks:',
          checks || 'none',
          '',
          'Files:',
          files || 'none',
          '',
          'Comments:',
          comments || 'none',
        ].join('\n');
      },
    }),
  };
}
