/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
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
  addBuiltinMcpsToOpenCodeConfig,
  addPluginToOpenCodeConfig,
  addPluginToOpenCodeTuiConfig,
  detectCurrentConfig,
  disableDefaultAgents,
  enableLspByDefault,
  materializeDefaultBoardAgentDefinitions,
  parseConfig,
  parseConfigFile,
  stripJsonComments,
  switchProviderConfig,
  writeBlacktowerConfig,
  writeConfig,
} from './config-io';
import * as paths from './paths';

describe('config-io', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };
  const originalArgv = [...process.argv];

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'opencode-io-test-'));
    delete process.env.OPENCODE_CONFIG_DIR;
    delete process.env.OPENCODE_TUI_CONFIG;
    process.env.XDG_CONFIG_HOME = tmpDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
    mock.restore();
  });

  function writePackageJson(dir: string): void {
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'blacktower' }),
    );
  }

  test('stripJsonComments strips comments and trailing commas', () => {
    const jsonc = `{
      // comment
      "a": 1, /* multi
      line */
      "b": [2,],
    }`;
    const stripped = stripJsonComments(jsonc);
    expect(JSON.parse(stripped)).toEqual({ a: 1, b: [2] });
  });

  test('parseConfigFile parses valid JSON', () => {
    const path = join(tmpDir, 'test.json');
    writeFileSync(path, '{"a": 1}');
    const result = parseConfigFile(path);
    expect(result.config).toEqual({ a: 1 } as any);
    expect(result.error).toBeUndefined();
  });

  test('parseConfigFile returns null for non-existent file', () => {
    const result = parseConfigFile(join(tmpDir, 'nonexistent.json'));
    expect(result.config).toBeNull();
  });

  test('parseConfigFile returns null for empty or whitespace-only file', () => {
    const emptyPath = join(tmpDir, 'empty.json');
    writeFileSync(emptyPath, '');
    expect(parseConfigFile(emptyPath).config).toBeNull();

    const whitespacePath = join(tmpDir, 'whitespace.json');
    writeFileSync(whitespacePath, '   \n  ');
    expect(parseConfigFile(whitespacePath).config).toBeNull();
  });

  test('parseConfigFile returns error for invalid JSON', () => {
    const path = join(tmpDir, 'invalid.json');
    writeFileSync(path, '{"a": 1');
    const result = parseConfigFile(path);
    expect(result.config).toBeNull();
    expect(result.error).toBeDefined();
  });

  test('parseConfig tries .jsonc if .json is missing', () => {
    const jsoncPath = join(tmpDir, 'test.jsonc');
    writeFileSync(jsoncPath, '{"a": 1}');

    // We pass .json path, it should try .jsonc
    const result = parseConfig(join(tmpDir, 'test.json'));
    expect(result.config).toEqual({ a: 1 } as any);
  });

  test('parseConfig tries .json if .jsonc is missing', () => {
    const jsonPath = join(tmpDir, 'test.json');
    writeFileSync(jsonPath, '{"a": 1}');

    const result = parseConfig(join(tmpDir, 'test.jsonc'));
    expect(result.config).toEqual({ a: 1 } as any);
  });

  test('writeConfig writes JSON and backs up under backups directory', () => {
    const path = join(tmpDir, 'test.json');
    writeFileSync(path, '{"old": true}');

    writeConfig(path, { new: true } as any);

    expect(JSON.parse(readFileSync(path, 'utf-8'))).toEqual({ new: true });
    const backupsDir = join(tmpDir, 'opencode', 'backups');
    const backupSubdirs = readdirSync(backupsDir);
    expect(backupSubdirs).toHaveLength(1);
    const backupRun = readFileSync(
      join(backupsDir, backupSubdirs[0] ?? '', 'test.json'),
      'utf-8',
    );
    expect(JSON.parse(backupRun)).toEqual({
      old: true,
    });
    expect(existsSync(`${path}.bak`)).toBe(false);
  });

  test('addPluginToOpenCodeConfig adds plugin and removes duplicates', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(
      configPath,
      JSON.stringify({ plugin: ['other', 'blacktower@1.0.0'] }),
    );
    process.argv[1] = '';

    const result = await addPluginToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toContain('blacktower');
    expect(saved.plugin).not.toContain('blacktower@1.0.0');
    expect(saved.plugin.length).toBe(2);
  });

  test('addPluginToOpenCodeConfig prefers opencode.jsonc when both files exist', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const configJsoncPath = join(tmpDir, 'opencode', 'opencode.jsonc');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ plugin: ['json-config'] }));
    writeFileSync(
      configJsoncPath,
      JSON.stringify({ plugin: ['jsonc-config'] }),
    );
    process.argv[1] = '';

    const result = await addPluginToOpenCodeConfig();
    expect(result.success).toBe(true);
    expect(result.configPath).toBe(configJsoncPath);

    const savedJson = JSON.parse(readFileSync(configPath, 'utf-8'));
    const savedJsonc = JSON.parse(readFileSync(configJsoncPath, 'utf-8'));
    expect(savedJson.plugin).toEqual(['json-config']);
    expect(savedJsonc.plugin).toEqual(['jsonc-config', 'blacktower']);
  });

  test('addPluginToOpenCodeConfig stores package name for bunx temp paths', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const packageRoot = join(
      tmpDir,
      'bunx-1000-blacktower@latest',
      'node_modules',
      'blacktower',
    );
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ plugin: [] }));
    writePackageJson(packageRoot);
    process.argv[1] = join(packageRoot, 'dist', 'cli', 'index.js');

    const result = await addPluginToOpenCodeConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toEqual(['blacktower']);
  });

  test('addPluginToOpenCodeConfig stores local repo path for local dev paths', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const packageRoot = join(tmpDir, 'repo');
    const localCliPath = join(packageRoot, 'dist', 'cli', 'index.js');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ plugin: [] }));
    writePackageJson(packageRoot);
    process.argv[1] = localCliPath;

    const result = await addPluginToOpenCodeConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toEqual([packageRoot]);
  });

  test('addPluginToOpenCodeConfig stores local repo path for local paths containing bunx-', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const packageRoot = join(tmpDir, 'repo', 'bunx-tools');
    const localCliPath = join(packageRoot, 'dist', 'cli', 'index.js');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ plugin: [] }));
    writePackageJson(packageRoot);
    process.argv[1] = localCliPath;

    const result = await addPluginToOpenCodeConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toEqual([packageRoot]);
  });

  test('addPluginToOpenCodeConfig deduplicates existing local repo path entries', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const packageRoot = join(tmpDir, 'repo');
    const localCliPath = join(packageRoot, 'dist', 'cli', 'index.js');
    paths.ensureConfigDir();
    writePackageJson(packageRoot);
    writeFileSync(
      configPath,
      JSON.stringify({ plugin: ['other', packageRoot] }),
    );
    process.argv[1] = localCliPath;

    const result = await addPluginToOpenCodeConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toEqual(['other', packageRoot]);
  });

  test('addPluginToOpenCodeConfig preserves non-string plugin entries when refreshing', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    process.argv[1] = '';

    const objectPlugin = { name: 'some-config-plugin', enabled: true };
    writeFileSync(
      configPath,
      JSON.stringify({
        plugin: ['other-plugin', objectPlugin, 'blacktower@1.0.0'],
      }),
    );

    const result = await addPluginToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toContain('blacktower');
    expect(saved.plugin).toContain('other-plugin');
    expect(saved.plugin).not.toContain('blacktower@1.0.0');
    // Non-string entries (objects) must survive the plugin refresh
    expect(saved.plugin).toContainEqual(objectPlugin);
    expect(saved.plugin.length).toBe(3);
  });

  test('addPluginToOpenCodeConfig removes tuple plugin entries', async () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(
      configPath,
      JSON.stringify({
        plugin: ['other', ['blacktower', { enabled: true }]],
      }),
    );
    process.argv[1] = '';

    const result = await addPluginToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.plugin).toEqual(['other', 'blacktower']);
  });

  test('addBuiltinMcpsToOpenCodeConfig writes host MCP definitions without clobbering existing auth', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(
      configPath,
      JSON.stringify({
        mcp: {
          websearch: {
            type: 'remote',
            url: 'https://mcp.exa.ai/mcp?tools=web_search_exa',
            oauth: { clientId: 'existing' },
          },
        },
      }),
    );

    const result = addBuiltinMcpsToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.mcp.context7).toMatchObject({
      type: 'remote',
      url: 'https://mcp.context7.com/mcp',
    });
    expect(saved.mcp.grep_app).toMatchObject({
      type: 'remote',
      url: 'https://mcp.grep.app',
    });
    expect(saved.mcp.grep_app.oauth).toBeUndefined();
    expect(saved.mcp.websearch.oauth).toEqual({ clientId: 'existing' });
    expect(saved.mcp.playwright.enabled).toBeUndefined();
  });

  test('addBuiltinMcpsToOpenCodeConfig removes legacy default-disabled flags', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(
      configPath,
      JSON.stringify({
        mcp: {
          github: { type: 'local', command: ['old'], enabled: false },
          playwright: { type: 'local', command: ['old'], enabled: false },
        },
      }),
    );

    const result = addBuiltinMcpsToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.mcp.github.enabled).toBeUndefined();
    expect(saved.mcp.playwright.enabled).toBeUndefined();
  });

  test('materializeDefaultBoardAgentDefinitions writes missing files and preserves existing ones', () => {
    const boardAgentDir = join(tmpDir, 'opencode', 'blacktower', 'agents');
    const existingPath = join(boardAgentDir, 'backend-architect.json');
    paths.ensureConfigDir();
    mkdirSync(boardAgentDir, { recursive: true });
    writeFileSync(existingPath, JSON.stringify({ preserved: true }));

    const result = materializeDefaultBoardAgentDefinitions();

    expect(result.success).toBe(true);
    expect(result.targetDir).toBe(boardAgentDir);
    expect(result.preserved).toContain('backend-architect');
    expect(result.written).toContain('go-advisor');
    expect(JSON.parse(readFileSync(existingPath, 'utf-8'))).toEqual({
      preserved: true,
    });
    expect(
      JSON.parse(readFileSync(join(boardAgentDir, 'go-advisor.json'), 'utf-8')),
    ).toMatchObject({ name: 'go-advisor', displayName: 'go-runner' });
  });

  test('materializeDefaultBoardAgentDefinitions uses OPENCODE_CONFIG_DIR when set', () => {
    const customConfigDir = join(tmpDir, 'custom-opencode');
    process.env.OPENCODE_CONFIG_DIR = customConfigDir;

    const result = materializeDefaultBoardAgentDefinitions({ dryRun: true });

    expect(result.targetDir).toBe(
      join(customConfigDir, 'blacktower', 'agents'),
    );
    expect(result.written).toHaveLength(0);
    expect(result.skipped).toHaveLength(26);
    expect(existsSync(result.targetDir)).toBe(false);
  });

  test('materializeDefaultBoardAgentDefinitions uses XDG config home when OPENCODE_CONFIG_DIR is unset', () => {
    delete process.env.OPENCODE_CONFIG_DIR;

    const result = materializeDefaultBoardAgentDefinitions({ dryRun: true });

    expect(result.targetDir).toBe(
      join(tmpDir, 'opencode', 'blacktower', 'agents'),
    );
  });

  test('switchProviderConfig updates board agents and active built-in preset', () => {
    paths.ensureConfigDir();
    const blacktowerConfigPath = join(tmpDir, 'opencode', 'blacktower.json');
    writeFileSync(
      blacktowerConfigPath,
      JSON.stringify({
        $schema: 'old-schema',
        preset: 'openai',
        presets: {
          openai: {
            explorer: { model: 'openai/gpt-5.4-mini' },
          },
        },
      }),
    );

    const result = switchProviderConfig('github-copilot');

    expect(result.success).toBe(true);
    expect(result.presetName).toBe('board-github-copilot');
    expect(result.boardAgents.written).toContain('python-advisor');

    const saved = JSON.parse(readFileSync(blacktowerConfigPath, 'utf-8'));
    expect(saved.preset).toBe('board-github-copilot');
    expect(saved.presets.openai.explorer.model).toBe('openai/gpt-5.4-mini');
    expect(saved.presets['board-github-copilot'].explorer.model).toBe(
      'github-copilot/gpt-5.4-mini',
    );
    expect(saved.presets['board-github-copilot'].oracle.model).toBe(
      'github-copilot/gpt-5.5',
    );
    expect(saved.presets['board-github-copilot'].oracle.variant).toBe('high');
  });

  test('switchProviderConfig applies openrouter board and core overrides', () => {
    paths.ensureConfigDir();

    const result = switchProviderConfig('openrouter');

    expect(result.success).toBe(true);
    expect(result.presetName).toBe('board-openrouter');

    const blacktowerConfigPath = join(tmpDir, 'opencode', 'blacktower.json');
    const saved = JSON.parse(readFileSync(blacktowerConfigPath, 'utf-8'));
    expect(saved.preset).toBe('board-openrouter');
    expect(saved.presets['board-openrouter'].oracle.model).toBe(
      'openrouter/deepseek/deepseek-v4-pro',
    );
    expect(saved.presets['board-openrouter'].fixer.model).toBe(
      'openrouter/deepseek/deepseek-v4-flash',
    );

    const agentPath = join(
      tmpDir,
      'opencode',
      'blacktower',
      'agents',
      'docs-advisor.json',
    );
    const docsAdvisor = JSON.parse(readFileSync(agentPath, 'utf-8'));
    expect(docsAdvisor.model).toBe('openrouter/minimax/minimax-m2.5');
  });

  test('switchProviderConfig dry-run does not write config or board agents', () => {
    const result = switchProviderConfig('anthropic', { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.configUpdated).toBe(true);
    expect(result.boardAgents.skipped).toHaveLength(26);
    expect(existsSync(join(tmpDir, 'opencode', 'blacktower.json'))).toBe(false);
    expect(
      existsSync(
        join(tmpDir, 'opencode', 'blacktower', 'agents', 'python-advisor.json'),
      ),
    ).toBe(false);
  });

  test('switchProviderConfig rejects unknown provider before writing files', () => {
    const result = switchProviderConfig('unknown-provider');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown provider: unknown-provider');
    expect(result.boardAgents.written).toHaveLength(0);
    expect(existsSync(join(tmpDir, 'opencode', 'blacktower.json'))).toBe(false);
    expect(existsSync(join(tmpDir, 'opencode', 'blacktower', 'agents'))).toBe(
      false,
    );
  });

  test('addBuiltinMcpsToOpenCodeConfig upgrades broken generated github docker command', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(
      configPath,
      JSON.stringify({
        mcp: {
          github: {
            type: 'local',
            command: [
              'bash',
              '-lc',
              'export GITHUB_PERSONAL_ACCESS_TOKEN="$token"\nexec docker run -i --rm\n-e GITHUB_PERSONAL_ACCESS_TOKEN\nghcr.io/github/github-mcp-server stdio',
            ],
            enabled: true,
          },
        },
      }),
    );

    const result = addBuiltinMcpsToOpenCodeConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    const command = saved.mcp.github.command.join(' ');
    expect(saved.mcp.github.enabled).toBe(true);
    expect(command).toContain(
      'docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server stdio',
    );
    expect(command).not.toContain('docker run -i --rm\n-e');
  });

  test('addPluginToOpenCodeTuiConfig adds plugin to tui.json and removes duplicates', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    paths.ensureConfigDir();
    writeFileSync(
      tuiPath,
      JSON.stringify({ plugin: ['other', 'blacktower@1.0.0'] }),
    );
    process.argv[1] = '';

    const result = await addPluginToOpenCodeTuiConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toContain('blacktower/tui');
    expect(saved.plugin).not.toContain('blacktower@1.0.0');
    expect(saved.plugin.length).toBe(2);
  });

  test('addPluginToOpenCodeTuiConfig prefers tui.jsonc when both files exist', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    const tuiJsoncPath = join(tmpDir, 'opencode', 'tui.jsonc');
    paths.ensureConfigDir();
    writeFileSync(tuiPath, JSON.stringify({ plugin: ['json-config'] }));
    writeFileSync(tuiJsoncPath, JSON.stringify({ plugin: ['jsonc-config'] }));
    process.argv[1] = '';

    const result = await addPluginToOpenCodeTuiConfig();
    expect(result.success).toBe(true);
    expect(result.configPath).toBe(tuiJsoncPath);

    const savedJson = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    const savedJsonc = JSON.parse(readFileSync(tuiJsoncPath, 'utf-8'));
    expect(savedJson.plugin).toEqual(['json-config']);
    expect(savedJsonc.plugin).toEqual(['jsonc-config', 'blacktower/tui']);
  });

  test('addPluginToOpenCodeTuiConfig stores package name for bunx temp paths', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    const packageRoot = join(
      tmpDir,
      'bunx-1000-blacktower@latest',
      'node_modules',
      'blacktower',
    );
    paths.ensureConfigDir();
    writeFileSync(tuiPath, JSON.stringify({ plugin: [] }));
    writePackageJson(packageRoot);
    process.argv[1] = join(packageRoot, 'dist', 'cli', 'index.js');

    const result = await addPluginToOpenCodeTuiConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toEqual(['blacktower/tui']);
  });

  test('addPluginToOpenCodeTuiConfig removes tuple plugin entries', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    paths.ensureConfigDir();
    writeFileSync(
      tuiPath,
      JSON.stringify({
        plugin: ['other', ['blacktower', { enabled: true }]],
      }),
    );
    process.argv[1] = '';

    const result = await addPluginToOpenCodeTuiConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toEqual(['other', 'blacktower/tui']);
  });

  test('addPluginToOpenCodeTuiConfig honors OPENCODE_TUI_CONFIG', async () => {
    const tuiPath = join(tmpDir, 'custom', 'tui.custom.json');
    process.env.OPENCODE_TUI_CONFIG = tuiPath;
    process.argv[1] = '';

    const result = await addPluginToOpenCodeTuiConfig();
    expect(result.success).toBe(true);
    expect(result.configPath).toBe(tuiPath);

    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toEqual(['blacktower/tui']);
  });

  test('addPluginToOpenCodeTuiConfig does not bypass OPENCODE_TUI_CONFIG for existing default config', async () => {
    const defaultTuiPath = join(tmpDir, 'opencode', 'tui.jsonc');
    const customTuiPath = join(tmpDir, 'custom', 'tui.json');
    paths.ensureConfigDir();
    writeFileSync(defaultTuiPath, JSON.stringify({ plugin: ['default'] }));
    process.env.OPENCODE_TUI_CONFIG = customTuiPath;
    process.argv[1] = '';

    const result = await addPluginToOpenCodeTuiConfig();
    expect(result.success).toBe(true);
    expect(result.configPath).toBe(customTuiPath);

    const custom = JSON.parse(readFileSync(customTuiPath, 'utf-8'));
    const original = JSON.parse(readFileSync(defaultTuiPath, 'utf-8'));
    expect(custom.plugin).toEqual(['blacktower/tui']);
    expect(original.plugin).toEqual(['default']);
  });

  test('addPluginToOpenCodeTuiConfig stores local repo path for local dev paths', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    const packageRoot = join(tmpDir, 'repo');
    const localCliPath = join(packageRoot, 'dist', 'cli', 'index.js');
    paths.ensureConfigDir();
    writeFileSync(tuiPath, JSON.stringify({ plugin: [] }));
    writePackageJson(packageRoot);
    process.argv[1] = localCliPath;

    const result = await addPluginToOpenCodeTuiConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toEqual([join(packageRoot, 'dist', 'tui.js')]);
  });

  test('addPluginToOpenCodeTuiConfig deduplicates existing local repo path entries', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    const packageRoot = join(tmpDir, 'repo');
    const localCliPath = join(packageRoot, 'dist', 'cli', 'index.js');
    paths.ensureConfigDir();
    writePackageJson(packageRoot);
    writeFileSync(
      tuiPath,
      JSON.stringify({
        plugin: ['other', join(packageRoot, 'dist', 'tui.js')],
      }),
    );
    process.argv[1] = localCliPath;

    const result = await addPluginToOpenCodeTuiConfig();

    expect(result.success).toBe(true);
    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toEqual([
      'other',
      join(packageRoot, 'dist', 'tui.js'),
    ]);
  });

  test('addPluginToOpenCodeTuiConfig preserves non-string plugin entries when refreshing', async () => {
    const tuiPath = join(tmpDir, 'opencode', 'tui.json');
    paths.ensureConfigDir();
    process.argv[1] = '';

    const objectPlugin = { name: 'some-tui-plugin', enabled: true };
    writeFileSync(
      tuiPath,
      JSON.stringify({
        plugin: ['other-plugin', objectPlugin, 'blacktower@1.0.0'],
      }),
    );

    const result = await addPluginToOpenCodeTuiConfig();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(tuiPath, 'utf-8'));
    expect(saved.plugin).toContain('blacktower/tui');
    expect(saved.plugin).toContain('other-plugin');
    expect(saved.plugin).not.toContain('blacktower@1.0.0');
    // Non-string entries (objects) must survive the plugin refresh
    expect(saved.plugin).toContainEqual(objectPlugin);
    expect(saved.plugin.length).toBe(3);
  });

  test('writeBlacktowerConfig writes schema-only config for default install', () => {
    const litePath = join(tmpDir, 'opencode', 'blacktower.json');
    paths.ensureConfigDir();

    const result = writeBlacktowerConfig({
      hasTmux: true,
      installSkills: true,
      reset: false,
    });
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(litePath, 'utf-8'));
    expect(saved).toEqual({
      $schema: 'https://unpkg.com/blacktower@latest/blacktower.schema.json',
    });
  });

  test('writeBlacktowerConfig writes generated OpenAI preset when skills are disabled', () => {
    const litePath = join(tmpDir, 'opencode', 'blacktower.json');
    paths.ensureConfigDir();

    const result = writeBlacktowerConfig({
      hasTmux: true,
      installSkills: false,
      reset: false,
    });
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(litePath, 'utf-8'));
    expect(saved.preset).toBe('openai');
    expect(saved.presets.openai).toBeDefined();
    expect(saved.presets['opencode-go']).toBeUndefined();
    expect(saved.skillProfiles.global).toEqual([]);
  });

  test('writeBlacktowerConfig writes selected preset', () => {
    const litePath = join(tmpDir, 'opencode', 'blacktower.json');
    paths.ensureConfigDir();

    const result = writeBlacktowerConfig({
      hasTmux: false,
      installSkills: false,
      preset: 'opencode-go',
      reset: false,
    });
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(litePath, 'utf-8'));
    expect(saved.preset).toBe('opencode-go');
    expect(saved.disabled_agents).toEqual([]);
    expect(saved.presets.openai).toBeUndefined();
    expect(saved.presets['opencode-go'].orchestrator.model).toBe(
      'opencode-go/glm-5.1',
    );
    expect(saved.presets['opencode-go'].observer.model).toBe(
      'opencode-go/kimi-k2.6',
    );
  });

  test('disableDefaultAgents disables explore and general agents', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({}));

    const result = disableDefaultAgents();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.agent.explore.disable).toBe(true);
    expect(saved.agent.general.disable).toBe(true);
  });

  test('enableLspByDefault sets lsp true when missing', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ plugin: ['other'] }));

    const result = enableLspByDefault();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.lsp).toBe(true);
    expect(saved.plugin).toEqual(['other']);
  });

  test('enableLspByDefault preserves explicit lsp config', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ lsp: false }));

    const result = enableLspByDefault();
    expect(result.success).toBe(true);

    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.lsp).toBe(false);
  });

  test('enableLspByDefault does not write when lsp exists', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    paths.ensureConfigDir();
    writeFileSync(configPath, JSON.stringify({ lsp: false }));

    const result = enableLspByDefault();
    expect(result.success).toBe(true);

    expect(existsSync(`${configPath}.bak`)).toBe(false);
    expect(existsSync(join(tmpDir, 'opencode', 'backups'))).toBe(false);
  });

  test('detectCurrentConfig detects installed status', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const litePath = join(tmpDir, 'opencode', 'blacktower.json');
    paths.ensureConfigDir();

    writeFileSync(
      configPath,
      JSON.stringify({
        plugin: ['blacktower'],
        provider: {
          kimi: {
            npm: '@ai-sdk/openai-compatible',
          },
        },
      }),
    );
    writeFileSync(
      litePath,
      JSON.stringify({
        preset: 'openai',
        presets: {
          openai: {
            orchestrator: { model: 'openai/gpt-4' },
            oracle: { model: 'anthropic/claude-opus-4-6' },
            explorer: { model: 'github-copilot/grok-code-fast-1' },
            librarian: { model: 'zai-coding-plan/glm-4.7' },
          },
        },
        tmux: { enabled: true },
      }),
    );

    const detected = detectCurrentConfig();
    expect(detected.isInstalled).toBe(true);
    expect(detected.hasKimi).toBe(true);
    expect(detected.hasOpenAI).toBe(true);
    expect(detected.hasAnthropic).toBe(true);
    expect(detected.hasCopilot).toBe(true);
    expect(detected.hasZaiPlan).toBe(true);
    expect(detected.hasTmux).toBe(true);
  });

  test('detectCurrentConfig prefers lite .jsonc over .json', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const litePath = join(tmpDir, 'opencode', 'blacktower.json');
    const liteJsoncPath = join(tmpDir, 'opencode', 'blacktower.jsonc');
    paths.ensureConfigDir();

    writeFileSync(configPath, JSON.stringify({ plugin: ['blacktower'] }));
    writeFileSync(
      litePath,
      JSON.stringify({
        preset: 'default',
        presets: {
          default: {
            orchestrator: { model: 'openai/gpt-4' },
          },
        },
      }),
    );
    writeFileSync(
      liteJsoncPath,
      JSON.stringify({
        preset: 'default',
        presets: {
          default: {
            orchestrator: { model: 'anthropic/claude-opus-4-6' },
          },
        },
      }),
    );

    const detected = detectCurrentConfig();
    expect(detected.hasOpenAI).toBe(false);
    expect(detected.hasAnthropic).toBe(true);
  });

  test('detectCurrentConfig treats local repo path entries as installed', () => {
    const configPath = join(tmpDir, 'opencode', 'opencode.json');
    const packageRoot = join(tmpDir, 'repo');
    paths.ensureConfigDir();
    writePackageJson(packageRoot);
    writeFileSync(configPath, JSON.stringify({ plugin: [packageRoot] }));

    const detected = detectCurrentConfig();

    expect(detected.isInstalled).toBe(true);
  });
});
