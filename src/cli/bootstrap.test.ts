import { describe, expect, test } from 'bun:test';
import {
  addPluginsToConfig,
  parseBootstrapArgs,
  tmuxHelperBlock,
  upsertManagedBlock,
} from './bootstrap';

describe('bootstrap CLI helpers', () => {
  test('parseBootstrapArgs parses automation flags', () => {
    expect(
      parseBootstrapArgs([
        '--with-dcp',
        '--with-quota',
        '--skip-opencode',
        '--skip-build',
        '--skip-shell-helper',
        '--skills=no',
        '--preset=opencode-go',
        '--reset',
        '--dry-run',
        '--yes',
        '--opencode-install-cmd=true',
      ]),
    ).toEqual({
      dryRun: true,
      yes: true,
      reset: true,
      skills: 'no',
      preset: 'opencode-go',
      skipOpencode: true,
      skipBuild: true,
      skipShellHelper: true,
      withDcp: true,
      withQuota: true,
      opencodeInstallCommand: 'true',
    });
  });

  test('addPluginsToConfig adds optional plugins without duplicates', () => {
    const config = addPluginsToConfig(
      {
        plugin: [
          'oh-my-opencode-slim',
          '@slkiser/opencode-quota',
          ['tuple-plugin', { enabled: true }],
        ],
      },
      ['@tarquinen/opencode-dcp@latest', '@slkiser/opencode-quota'],
    );

    expect(config.plugin).toEqual([
      'oh-my-opencode-slim',
      '@slkiser/opencode-quota',
      ['tuple-plugin', { enabled: true }],
      '@tarquinen/opencode-dcp@latest',
    ]);
  });

  test('tmuxHelperBlock defines omos with portable port selection', () => {
    const block = tmuxHelperBlock();

    expect(block).toContain('omos()');
    expect(block).toContain(
      'OPENCODE_PORT="$port" opencode --port "$port" "$@"',
    );
    expect(block).toContain('command -v shuf');
    expect(block).toContain('command -v jot');
  });

  test('upsertManagedBlock replaces previous helper block', () => {
    const first = upsertManagedBlock('before\n', tmuxHelperBlock());
    const second = upsertManagedBlock(first, 'managed-block');

    expect(second).toBe('before\n\nmanaged-block\n');
  });
});
