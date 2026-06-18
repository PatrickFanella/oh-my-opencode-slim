import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  addPluginsToConfig,
  applyBootstrapHostDefaults,
  backupOpenCodeConfig,
  buildDcpConfig,
  buildQuotaToastConfig,
  buildScheduledTasksPluginCacheManifest,
  buildScheduledTaskTemplateFiles,
  ensureDesiredOpenCodeDirectory,
  ensureScheduledTasksPluginCache,
  getOptionalTuiPluginSpecs,
  getScheduledTasksPluginCacheDir,
  installScheduledTaskTemplates,
  parseBootstrapArgs,
  resetOpenCodeConfigDirectory,
  tmuxHelperBlock,
  upsertManagedBlock,
} from './bootstrap';

describe('bootstrap CLI helpers', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'bootstrap-test-'));
    delete process.env.OPENCODE_CONFIG_DIR;
    process.env.XDG_CONFIG_HOME = tmpDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('parseBootstrapArgs parses automation flags', () => {
    expect(
      parseBootstrapArgs([
        '--with-dcp',
        '--with-quota',
        '--with-rtk',
        '--with-scheduled-tasks',
        '--skip-opencode',
        '--skip-build',
        '--skip-shell-helper',
        '--skip-rtk-init',
        '--skip-scheduled-tasks-daemon',
        '--skip-scheduled-tasks-commands',
        '--skip-scheduled-task-templates',
        '--skills=no',
        '--preset=opencode-go',
        '--reset',
        '--dry-run',
        '--yes',
        '--opencode-install-cmd=true',
        '--rtk-install-cmd=true',
        '--scheduled-tasks-daemon-cmd=true',
        '--scheduled-tasks-commands-cmd=true',
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
      skipRtkInit: true,
      skipScheduledTasksDaemon: true,
      skipScheduledTasksCommands: true,
      skipScheduledTaskTemplates: true,
      withDcp: true,
      withQuota: true,
      withRtk: true,
      withScheduledTasks: true,
      opencodeInstallCommand: 'true',
      rtkInstallCommand: 'true',
      scheduledTasksDaemonCommand: 'true',
      scheduledTasksCommandsCommand: 'true',
    });
  });

  test('parseBootstrapArgs enables scheduled tasks by default', () => {
    expect(parseBootstrapArgs([])).toEqual({
      skills: 'yes',
      withScheduledTasks: true,
    });
    expect(parseBootstrapArgs(['--no-scheduled-tasks'])).toEqual({
      skills: 'yes',
      withScheduledTasks: false,
    });
  });

  test('parseBootstrapArgs accepts legacy scheduled task skill flags', () => {
    expect(
      parseBootstrapArgs([
        '--skip-scheduled-tasks-skill',
        '--scheduled-tasks-skill-cmd=true',
      ]),
    ).toEqual({
      skills: 'yes',
      skipScheduledTasksCommands: true,
      withScheduledTasks: true,
      scheduledTasksCommandsCommand: 'true',
    });
  });

  test('addPluginsToConfig adds optional plugins without duplicates', () => {
    const config = addPluginsToConfig(
      {
        plugin: [
          'blacktower',
          '@slkiser/opencode-quota',
          ['tuple-plugin', { enabled: true }],
        ],
      },
      ['@tarquinen/opencode-dcp@latest', '@slkiser/opencode-quota'],
    );

    expect(config.plugin).toEqual([
      '@tarquinen/opencode-dcp@latest',
      'blacktower',
      '@slkiser/opencode-quota',
      ['tuple-plugin', { enabled: true }],
    ]);
  });

  test('addPluginsToConfig inserts optional plugins before local Blacktower plugin', () => {
    const config = addPluginsToConfig({ plugin: ['/repo/blacktower'] }, [
      '@tarquinen/opencode-dcp@latest',
      '@slkiser/opencode-quota',
    ]);

    expect(config.plugin).toEqual([
      '@tarquinen/opencode-dcp@latest',
      '@slkiser/opencode-quota',
      '/repo/blacktower',
    ]);
  });

  test('addPluginsToConfig adds scheduled tasks plugin', () => {
    const config = addPluginsToConfig({}, ['opencode-tasks']);

    expect(config.plugin).toEqual(['opencode-tasks']);
  });

  test('getOptionalTuiPluginSpecs adds quota TUI plugin only', () => {
    expect(getOptionalTuiPluginSpecs({ withQuota: true })).toEqual([
      '@slkiser/opencode-quota',
    ]);
    expect(
      getOptionalTuiPluginSpecs({
        withDcp: true,
        withScheduledTasks: true,
      }),
    ).toEqual([]);
  });

  test('applyBootstrapHostDefaults configures trusted host defaults', () => {
    const config = applyBootstrapHostDefaults(
      {
        plugin: ['existing-plugin'],
        compaction: { auto: true, extra: 'preserved' },
        skills: { paths: ['/existing/skills', '/home/test/.agents/skills'] },
      },
      { removeSkillPaths: ['/home/test/.agents/skills'] },
    );

    expect(config.plugin).toEqual(['existing-plugin']);
    expect(config.permission).toBe('allow');
    expect(config.compaction).toEqual({
      auto: false,
      prune: true,
      reserved: 10_000,
      extra: 'preserved',
    });
    expect(config.skills).toEqual({
      paths: ['/existing/skills'],
    });
  });

  test('applyBootstrapHostDefaults removes empty skills paths object', () => {
    const config = applyBootstrapHostDefaults(
      { skills: { paths: ['/home/test/.agents/skills'] } },
      { removeSkillPaths: ['/home/test/.agents/skills'] },
    );

    expect(config.skills).toBeUndefined();
  });

  test('buildDcpConfig writes range compression defaults', () => {
    const config = buildDcpConfig({ compress: { showCompression: true } });

    expect(config.enabled).toBe(true);
    expect(config.compress).toMatchObject({
      mode: 'range',
      permission: 'allow',
      minContextLimit: '35%',
      maxContextLimit: '65%',
      showCompression: false,
      summaryBuffer: true,
    });
    expect(config.experimental).toMatchObject({ allowSubAgents: true });
    expect(config.strategies).toMatchObject({
      deduplication: { enabled: true },
      purgeErrors: { enabled: true, turns: 4 },
    });
  });

  test('buildQuotaToastConfig writes nuc-style quota defaults', () => {
    const config = buildQuotaToastConfig({ enableToast: true });

    expect(config.enableToast).toBe(false);
    expect(config.showSessionTokens).toBe(true);
    expect(config.tuiSidebarPanel).toEqual({ enabled: true });
    expect(config.tuiCompactStatus).toEqual({
      enabled: true,
      homeBottom: true,
      sessionPrompt: true,
      suppressWhenNativeProviderQuota: true,
    });
  });

  test('resetOpenCodeConfigDirectory moves entries into backups instead of recursively deleting', () => {
    const configDir = join(tmpDir, 'opencode');
    mkdirSync(join(configDir, 'backups', 'existing'), { recursive: true });
    mkdirSync(join(configDir, 'skills'), { recursive: true });
    writeFileSync(join(configDir, 'opencode.jsonc'), '{}');
    writeFileSync(join(configDir, 'skills', 'legacy.md'), 'skill');
    writeFileSync(join(configDir, 'backups', 'existing', 'old.json'), '{}');

    const result = resetOpenCodeConfigDirectory(false);

    expect(result.ok).toBe(true);
    expect(existsSync(join(configDir, 'opencode.jsonc'))).toBe(false);
    expect(existsSync(join(configDir, 'skills'))).toBe(false);
    expect(existsSync(join(configDir, 'backups', 'existing', 'old.json'))).toBe(
      true,
    );
    const resetDirs = readdirSync(join(configDir, 'backups')).filter((entry) =>
      entry.startsWith('blacktower-reset-removed-'),
    );
    expect(resetDirs).toHaveLength(1);
    const resetDir = join(configDir, 'backups', resetDirs[0] ?? '');
    expect(readFileSync(join(resetDir, 'opencode.jsonc'), 'utf-8')).toBe('{}');
    expect(readFileSync(join(resetDir, 'skills', 'legacy.md'), 'utf-8')).toBe(
      'skill',
    );
  });

  test('backupOpenCodeConfig backs up the whole config directory except backups', async () => {
    const configDir = join(tmpDir, 'opencode');
    mkdirSync(join(configDir, 'commands'), { recursive: true });
    mkdirSync(join(configDir, 'backups', 'existing'), { recursive: true });
    writeFileSync(join(configDir, 'opencode.jsonc'), '{"current":true}');
    writeFileSync(join(configDir, 'commands', 'loop.md'), 'loop');
    writeFileSync(join(configDir, 'backups', 'existing', 'old.json'), '{}');

    const result = await backupOpenCodeConfig(false);

    expect(result.ok).toBe(true);
    const backupRoot = join(configDir, 'backups');
    const backupDirs = readdirSync(backupRoot).filter((entry) =>
      entry.startsWith('blacktower-bootstrap-'),
    );
    expect(backupDirs).toHaveLength(1);
    const backupDir = join(backupRoot, backupDirs[0] ?? '');
    expect(readFileSync(join(backupDir, 'opencode.jsonc'), 'utf-8')).toBe(
      '{"current":true}',
    );
    expect(readFileSync(join(backupDir, 'commands', 'loop.md'), 'utf-8')).toBe(
      'loop',
    );
    expect(existsSync(join(backupDir, 'backups'))).toBe(false);
  });

  test('ensureDesiredOpenCodeDirectory creates expected base layout', () => {
    const configDir = join(tmpDir, 'opencode');

    const result = ensureDesiredOpenCodeDirectory(false);

    expect(result.ok).toBe(true);
    expect(existsSync(join(configDir, 'backups'))).toBe(true);
    expect(existsSync(join(configDir, 'commands'))).toBe(true);
    expect(existsSync(join(configDir, 'blacktower'))).toBe(true);
    expect(existsSync(join(configDir, 'plugins'))).toBe(true);
    expect(existsSync(join(configDir, 'skills'))).toBe(true);
    expect(readFileSync(join(configDir, '.gitignore'), 'utf-8')).toContain(
      'node_modules',
    );
    const packageJson = JSON.parse(
      readFileSync(join(configDir, 'package.json'), 'utf-8'),
    );
    expect(packageJson.dependencies['@opencode-ai/plugin']).toBe('1.15.3');
  });

  test('buildScheduledTasksPluginCacheManifest installs runtime peer dependency', () => {
    const packageJson = JSON.parse(buildScheduledTasksPluginCacheManifest());

    expect(packageJson.dependencies['opencode-tasks']).toBe('latest');
    expect(packageJson.dependencies['@opencode-ai/plugin']).toBe('1.15.3');
  });

  test('buildScheduledTaskTemplateFiles creates disabled task templates', () => {
    const templates = buildScheduledTaskTemplateFiles(
      '/tmp/opencode-config',
      '/home/tester',
    );

    expect(Object.keys(templates).sort()).toEqual([
      'linux-server-daily-audit.md',
      'linux-server-weekly-hygiene.md',
      'scheduler-health-watch.md',
    ]);
    expect(templates['scheduler-health-watch.md']).toContain('enabled: false');
    expect(templates['scheduler-health-watch.md']).toContain(
      '/tmp/opencode-config/task-reports/scheduler-health-watch.md',
    );
  });

  test('installScheduledTaskTemplates writes templates without overwriting', () => {
    const configDir = join(tmpDir, 'opencode');
    const templateDir = join(configDir, 'task-templates');
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(join(templateDir, 'scheduler-health-watch.md'), 'custom');

    const result = installScheduledTaskTemplates({ withScheduledTasks: true });

    expect(result.ok).toBe(true);
    expect(
      readFileSync(join(templateDir, 'scheduler-health-watch.md'), 'utf-8'),
    ).toBe('custom');
    expect(existsSync(join(templateDir, 'linux-server-daily-audit.md'))).toBe(
      true,
    );
    expect(
      existsSync(join(templateDir, 'linux-server-weekly-hygiene.md')),
    ).toBe(true);
  });

  test('ensureScheduledTasksPluginCache prepares OpenCode cache with required packages', async () => {
    const fakeBin = join(tmpDir, 'bin');
    const fakeBun = join(fakeBin, 'bun');
    mkdirSync(fakeBin, { recursive: true });
    writeFileSync(
      fakeBun,
      `#!/usr/bin/env bash
set -euo pipefail
mkdir -p node_modules/opencode-tasks node_modules/@opencode-ai/plugin
printf '{"name":"opencode-tasks"}\n' > node_modules/opencode-tasks/package.json
printf '{"name":"@opencode-ai/plugin"}\n' > node_modules/@opencode-ai/plugin/package.json
`,
    );
    chmodSync(fakeBun, 0o755);
    process.env.XDG_CACHE_HOME = join(tmpDir, 'cache');
    process.env.PATH = `${fakeBin}:${process.env.PATH ?? ''}`;

    const result = await ensureScheduledTasksPluginCache({
      withScheduledTasks: true,
    });
    const cacheDir = getScheduledTasksPluginCacheDir();

    expect(result.ok).toBe(true);
    expect(readFileSync(join(cacheDir, 'package.json'), 'utf-8')).toBe(
      buildScheduledTasksPluginCacheManifest(),
    );
    expect(
      existsSync(
        join(cacheDir, 'node_modules', 'opencode-tasks', 'package.json'),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          cacheDir,
          'node_modules',
          '@opencode-ai',
          'plugin',
          'package.json',
        ),
      ),
    ).toBe(true);
  });

  test('tmuxHelperBlock defines OpenCode helpers with portable port selection', () => {
    const block = tmuxHelperBlock();

    expect(block).toContain('__blacktower_opencode_with_port()');
    expect(block).toContain('opencode()');
    expect(block).toContain('oc()');
    expect(block).toContain('occ()');
    expect(block).toContain('unalias opencode oc occ');
    expect(block).toContain(
      'OPENCODE_PORT="$port" command opencode --port "$port" "$@"',
    );
    expect(block).toContain('__blacktower_opencode_with_port --continue "$@"');
    expect(block).toContain('Bypass shell functions and aliases');
    expect(block).toContain('command -v shuf');
    expect(block).toContain('command -v jot');
  });

  test('upsertManagedBlock replaces previous helper block', () => {
    const first = upsertManagedBlock('before\n', tmuxHelperBlock());
    const second = upsertManagedBlock(first, 'managed-block');

    expect(second).toBe('before\n\nmanaged-block\n');
  });

  test('upsertManagedBlock preserves safe existing helper', () => {
    const existing = `prefix\n
opencode() {
  local port
  port="4096"
  OPENCODE_PORT="$port" "$OPENCODE_BIN" --port "$port" "$@"
}

oc() {
  opencode "$@"
}

occ() {
  opencode --continue "$@"
}
`;

    expect(upsertManagedBlock(existing, tmuxHelperBlock())).toBe(existing);
  });

  test('upsertManagedBlock appends after incomplete existing helper', () => {
    const existing = `prefix

opencode() {
  local port
  port="4096"
  OPENCODE_PORT="$port" "$OPENCODE_BIN" --port "$port" "$@"
}
`;

    const result = upsertManagedBlock(existing, tmuxHelperBlock());
    expect(result).toContain('__blacktower_opencode_with_port()');
    expect(result).toContain('opencode()');
    expect(result).toContain('occ()');
  });

  test('upsertManagedBlock appends after unsafe existing helper', () => {
    const existing = `prefix\n
opencode() {
  local port
  port="4096"
  OPENCODE_PORT="$port" opencode --port "$port" "$@"
}\n`;

    expect(upsertManagedBlock(existing, tmuxHelperBlock())).toContain(
      'OPENCODE_PORT="$port" command opencode --port "$port" "$@"',
    );
  });
});
