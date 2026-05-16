import { describe, expect, test } from 'bun:test';
import { createReviewToolkit } from './index';

const TOOL_NAMES = [
  'review_auto',
  'review_changed_files',
  'review_complexity',
  'review_coverage_gaps',
  'review_dead_exports',
  'review_diff',
  'review_pr_ready',
  'review_search',
  'review_summary',
  'review_todos',
] as const;

function fakeShell() {
  return {
    nothrow: () => fakeShell(),
    quiet: async () => ({ stdout: '', stderr: '' }),
  };
}

describe('review toolkit', () => {
  test('registers all review tools', () => {
    const toolkit = createReviewToolkit({
      $: (() => fakeShell()) as unknown,
      directory: '/tmp/project',
    });

    expect(Object.keys(toolkit.tools).sort()).toEqual([...TOOL_NAMES].sort());
  });

  test('registers command templates and preserves user overrides', () => {
    const toolkit = createReviewToolkit({
      $: (() => fakeShell()) as unknown,
      directory: '/tmp/project',
    });

    const config: Record<string, unknown> = {
      command: {
        'review-diff': {
          description: 'custom',
          template: 'custom template',
        },
      },
    };

    toolkit.registerCommands(config);

    const commands = config.command as Record<
      string,
      { description: string; template: string }
    >;

    expect(commands['review-diff']).toEqual({
      description: 'custom',
      template: 'custom template',
    });
    expect(commands['review-auto'].description).toBe(
      'Enable, disable, or inspect automatic review reminders',
    );
    expect(commands['review-auto-on'].template).toContain('mode `on`');
    expect(commands['review-auto-off'].template).toContain('mode `off`');
    expect(commands['review-auto-status'].template).toContain('mode `status`');
    expect(commands['review-summary'].template).toContain('review_summary');
  });

  test('fails fast without shell runner when enabled', () => {
    expect(() =>
      createReviewToolkit({
        $: undefined,
        directory: '/tmp/project',
      }),
    ).toThrow('Review toolkit requires OpenCode shell runner.');
  });
});
