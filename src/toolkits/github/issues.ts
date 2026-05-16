import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import type { ShellRunner } from './helpers';
import { optionalFlag, repoFlag, runShell, shellEscape } from './helpers';

export function createIssueTools({
  $,
}: {
  $: ShellRunner;
}): Record<string, ToolDefinition> {
  return {
    gh_issue_create: tool({
      description: 'Create a GitHub issue with labels and assignees.',
      args: {
        title: tool.schema.string().describe('Issue title'),
        body: tool.schema.string().optional().describe('Issue body'),
        labels: tool.schema
          .string()
          .optional()
          .describe('Comma-separated labels'),
        assignees: tool.schema
          .string()
          .optional()
          .describe('Comma-separated assignees or @me'),
        milestone: tool.schema
          .string()
          .optional()
          .describe('Optional milestone title'),
        repo: tool.schema.string().optional().describe('Optional owner/repo'),
      },
      async execute(args, context) {
        const command = [
          `gh issue create --title ${shellEscape(args.title)}`,
          optionalFlag('--body', args.body),
          optionalFlag('--label', args.labels),
          optionalFlag('--assignee', args.assignees),
          optionalFlag('--milestone', args.milestone),
          repoFlag(args.repo),
        ].join('');

        const output = await runShell($, command);

        context.metadata({
          title: 'Issue create',
          metadata: { title: args.title, repo: args.repo || 'current' },
        });

        return output || `Created issue ${args.title}.`;
      },
    }),

    gh_issue_update: tool({
      description: 'Update issue title/body/state/labels/assignees.',
      args: {
        issue_number: tool.schema
          .number()
          .int()
          .min(1)
          .describe('Issue number'),
        title: tool.schema.string().optional().describe('Updated title'),
        body: tool.schema.string().optional().describe('Updated body'),
        state: tool.schema
          .enum(['open', 'closed'])
          .optional()
          .describe('Open or close issue'),
        add_labels: tool.schema
          .string()
          .optional()
          .describe('Comma-separated labels to add'),
        remove_labels: tool.schema
          .string()
          .optional()
          .describe('Comma-separated labels to remove'),
        add_assignees: tool.schema
          .string()
          .optional()
          .describe('Comma-separated assignees to add'),
        remove_assignees: tool.schema
          .string()
          .optional()
          .describe('Comma-separated assignees to remove'),
        milestone: tool.schema
          .string()
          .optional()
          .describe('Optional milestone title'),
        repo: tool.schema.string().optional().describe('Optional owner/repo'),
      },
      async execute(args, context) {
        const editFlags = [
          optionalFlag('--title', args.title),
          optionalFlag('--body', args.body),
          optionalFlag('--add-label', args.add_labels),
          optionalFlag('--remove-label', args.remove_labels),
          optionalFlag('--add-assignee', args.add_assignees),
          optionalFlag('--remove-assignee', args.remove_assignees),
          optionalFlag('--milestone', args.milestone),
        ].filter(Boolean);

        const output =
          editFlags.length > 0
            ? await runShell(
                $,
                [
                  `gh issue edit ${args.issue_number}`,
                  ...editFlags,
                  repoFlag(args.repo),
                ].join(''),
              )
            : '';

        const stateOutput =
          args.state === 'closed'
            ? await runShell(
                $,
                `gh issue close ${args.issue_number}${repoFlag(args.repo)}`,
              )
            : args.state === 'open'
              ? await runShell(
                  $,
                  `gh issue reopen ${args.issue_number}${repoFlag(args.repo)}`,
                )
              : '';

        context.metadata({
          title: 'Issue update',
          metadata: { issue: args.issue_number, repo: args.repo || 'current' },
        });

        return (
          [output, stateOutput].filter(Boolean).join('\n') ||
          `Updated issue #${args.issue_number}.`
        );
      },
    }),

    gh_issue_comment: tool({
      description: 'Add a comment to an issue.',
      args: {
        issue_number: tool.schema
          .number()
          .int()
          .min(1)
          .describe('Issue number'),
        body: tool.schema.string().describe('Comment body'),
        repo: tool.schema.string().optional().describe('Optional owner/repo'),
      },
      async execute(args, context) {
        const output = await runShell(
          $,
          `gh issue comment ${args.issue_number} --body ${shellEscape(args.body)}${repoFlag(args.repo)}`,
        );

        context.metadata({
          title: 'Issue comment',
          metadata: { issue: args.issue_number, repo: args.repo || 'current' },
        });

        return output || `Commented on issue #${args.issue_number}.`;
      },
    }),

    gh_issue_list: tool({
      description: 'List GitHub issues with optional label and state.',
      args: {
        label: tool.schema.string().optional().describe('Label filter'),
        state: tool.schema.string().optional().describe('open, closed, all'),
      },
      async execute(args, context) {
        const state = args.state || 'open';
        const label = args.label ? ` --label ${shellEscape(args.label)}` : '';

        const output = await runShell(
          $,
          `gh issue list --state ${shellEscape(state)}${label} --json number,title,labels,assignees --jq '.[] | "#" + (.number|tostring) + " " + .title'`,
        );

        context.metadata({
          title: 'Issue list',
          metadata: { state, label: args.label || null },
        });

        return output || `No ${state} issues.`;
      },
    }),
  };
}
