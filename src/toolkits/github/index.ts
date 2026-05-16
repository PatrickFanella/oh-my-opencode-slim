import type { ToolDefinition } from '@opencode-ai/plugin';
import {
  type CommandTemplate,
  registerCommandTemplates,
} from '../command-registry';
import { assertShellRunner } from './helpers';
import { createIssueTools } from './issues';
import { createPrWorkflowTools } from './pr-workflow';
import { createPullRequestTools } from './pull-requests';
import { createRepoTools } from './repo';
import { createStatusTools } from './status';

const GITHUB_COMMAND_TEMPLATES: Record<string, CommandTemplate> = {
  'gh-branch-list': {
    description: 'List remote branches in the current repository',
    template:
      'Use the `gh_branch_list` tool.\n\nReply with a short summary of branch coverage.',
  },
  'gh-changed-files': {
    description: 'Show files changed against main/master',
    template:
      'Use the `gh_changed_files` tool.\n\nReply with short risk summary first.',
  },
  'gh-ci-status': {
    description: 'Show PR or branch CI status',
    template:
      'Treat `$ARGUMENTS` as optional `ref`.\n\nUse the `gh_ci_status` tool.\n\nReply with failing checks first.',
  },
  'gh-doctor': {
    description: 'Diagnose GitHub CLI and repo context problems',
    template:
      'Treat `$ARGUMENTS` as optional `repo=owner/repo`.\n\nUse the `gh_doctor` tool.\n\nReply with issues first.',
  },
  'gh-issue-comment': {
    description: 'Add a comment to an issue',
    template:
      'Interpret `$ARGUMENTS` as `issue_number :: body :: repo`.\n\nUse the `gh_issue_comment` tool.\n\nReply with one short confirmation line.',
  },
  'gh-issue-create': {
    description: 'Create a GitHub issue',
    template:
      'Interpret `$ARGUMENTS` as `title :: body :: labels :: assignees :: repo`.\n\nUse the `gh_issue_create` tool.\n\nReply with created issue URL or result first.',
  },
  'gh-issue-update': {
    description: 'Update a GitHub issue',
    template:
      'Interpret `$ARGUMENTS` as `issue_number [title=...] [state=open|closed] [add_labels=...] [remove_labels=...] [add_assignees=...] [remove_assignees=...] [repo=owner/repo]`.\n\nUse the `gh_issue_update` tool.\n\nReply with changed fields first.',
  },
  'gh-issues': {
    description: 'List GitHub issues',
    template:
      'Interpret `$ARGUMENTS` as optional `state` or `label=<name>` pairs.\n\nUse the `gh_issue_list` tool.\n\nReply with a short summary of count and filters used.',
  },
  'gh-pr-comment': {
    description: 'Add a comment to a pull request',
    template:
      'Interpret `$ARGUMENTS` as `pr_number :: body :: repo`.\n\nUse the `gh_pr_comment` tool.\n\nReply with one short confirmation line.',
  },
  'gh-pr-context': {
    description: 'Show PR context including checks, files, and comments',
    template:
      'Treat `$ARGUMENTS` as optional PR number.\n\nUse the `gh_pr_context` tool.\n\nReply with highest-risk issues first.',
  },
  'gh-pr-review': {
    description: 'Review a pull request',
    template:
      'Interpret `$ARGUMENTS` as `pr_number action :: body :: repo`, where action is `approve|comment|request-changes`.\n\nUse the `gh_pr_review` tool.\n\nReply with one short confirmation line.',
  },
  'gh-pr': {
    description: 'Show PR diff or comments',
    template:
      'Interpret `$ARGUMENTS` as `<number> [diff|comments]`.\n\nUse:\n\n- `gh_pr_diff` when mode omitted or `diff`\n- `gh_pr_comments` when mode is `comments`\n\nReply with a short summary and the main findings.',
  },
  'gh-review-queue': {
    description: 'List PRs needing review attention',
    template:
      'Use the `gh_review_queue` tool.\n\nReply with highest-priority review targets first.',
  },
  'gh-search': {
    description: 'Search tracked repo files with ripgrep',
    template:
      'Interpret `$ARGUMENTS` as `<pattern> [include]`.\n\nUse the `gh_search` tool.\n\nReply with highest-signal matches first.',
  },
  'gh-suite-status': {
    description: 'Summarize GitHub auth, repo, PR, runs, and review queue',
    template:
      'Treat `$ARGUMENTS` as optional `repo=owner/repo`.\n\nUse the `gh_suite_status` tool.\n\nReply with blockers first.',
  },
  'gh-tree': {
    description: 'Show tracked repository tree',
    template:
      'Interpret `$ARGUMENTS` as optional `path depth`.\n\nUse the `gh_tree` tool.\n\nReply with a short summary of what area was shown.',
  },
};

export function createGithubToolkit({
  $,
  directory,
}: {
  $: unknown;
  directory: string;
}): {
  registerCommands: (opencodeConfig: Record<string, unknown>) => void;
  tools: Record<string, ToolDefinition>;
} {
  void directory;
  const shellRunner = assertShellRunner($);

  const tools = {
    ...createRepoTools({ $: shellRunner }),
    ...createIssueTools({ $: shellRunner }),
    ...createPullRequestTools({ $: shellRunner }),
    ...createPrWorkflowTools({ $: shellRunner }),
    ...createStatusTools({ $: shellRunner }),
  };

  function registerCommands(opencodeConfig: Record<string, unknown>): void {
    registerCommandTemplates(opencodeConfig, GITHUB_COMMAND_TEMPLATES);
  }

  return { registerCommands, tools };
}
