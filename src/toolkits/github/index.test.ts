import { describe, expect, test } from 'bun:test';
import { createGithubToolkit } from './index';

const TOOL_NAMES = [
  'gh_branch_list',
  'gh_changed_files',
  'gh_ci_status',
  'gh_doctor',
  'gh_issue_comment',
  'gh_issue_create',
  'gh_issue_list',
  'gh_issue_update',
  'gh_pr_comment',
  'gh_pr_comments',
  'gh_pr_context',
  'gh_pr_diff',
  'gh_pr_review',
  'gh_review_queue',
  'gh_search',
  'gh_suite_status',
  'gh_tree',
] as const;

function fakeShell() {
  return {
    nothrow: () => fakeShell(),
    quiet: async () => ({ stdout: '', stderr: '' }),
  };
}

describe('github toolkit', () => {
  test('registers all GitHub tools', () => {
    const toolkit = createGithubToolkit({
      $: (() => fakeShell()) as unknown,
      directory: '/tmp/project',
    });

    expect(Object.keys(toolkit.tools).sort()).toEqual([...TOOL_NAMES].sort());
  });

  test('registers command templates and preserves user overrides', () => {
    const toolkit = createGithubToolkit({
      $: (() => fakeShell()) as unknown,
      directory: '/tmp/project',
    });

    const config: Record<string, unknown> = {
      command: {
        'gh-tree': {
          description: 'custom tree command',
          template: 'custom template',
        },
      },
    };

    toolkit.registerCommands(config);

    const commands = config.command as Record<
      string,
      { description: string; template: string }
    >;

    expect(commands['gh-tree']).toEqual({
      description: 'custom tree command',
      template: 'custom template',
    });

    expect(commands['gh-pr'].description).toBe('Show PR diff or comments');
    expect(commands['gh-pr'].template).toContain('gh_pr_diff');
    expect(commands['gh-pr'].template).toContain('gh_pr_comments');
    expect(commands['gh-suite-status'].description).toBe(
      'Summarize GitHub auth, repo, PR, runs, and review queue',
    );
  });

  test('fails fast without shell runner when enabled', () => {
    expect(() =>
      createGithubToolkit({
        $: undefined,
        directory: '/tmp/project',
      }),
    ).toThrow('GitHub toolkit requires OpenCode shell runner.');
  });
});
