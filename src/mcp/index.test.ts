import { describe, expect, test } from 'bun:test';
import { createBuiltinMcps } from './index';

describe('createBuiltinMcps', () => {
  const builtinNames = [
    'github',
    'playwright',
    'chrome-devtools',
    'context7',
    'microsoft-learn',
    'sentry',
    'stripe',
    'huggingface',
    'super-productivity',
    'websearch',
    'grep_app',
  ];

  test('returns all MCPs when no disabled list provided', () => {
    const mcps = createBuiltinMcps();
    const names = Object.keys(mcps);

    expect(names).toEqual(builtinNames);
  });

  test('returns all MCPs with empty disabled list', () => {
    const mcps = createBuiltinMcps([]);
    const names = Object.keys(mcps);

    expect(names).toEqual(builtinNames);
  });

  test('excludes single disabled MCP', () => {
    const mcps = createBuiltinMcps(['websearch']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).toContain('context7');
    expect(names).toContain('grep_app');
  });

  test('excludes multiple disabled MCPs', () => {
    const mcps = createBuiltinMcps(['websearch', 'grep_app']);
    const names = Object.keys(mcps);

    expect(names).not.toContain('websearch');
    expect(names).not.toContain('grep_app');
    expect(names).toContain('context7');
    expect(names.length).toBe(builtinNames.length - 2);
  });

  test('excludes all MCPs when all disabled', () => {
    const mcps = createBuiltinMcps(builtinNames);
    const names = Object.keys(mcps);

    expect(names.length).toBe(0);
  });

  test('ignores unknown MCP names in disabled list', () => {
    const mcps = createBuiltinMcps(['unknown_mcp', 'nonexistent']);
    const names = Object.keys(mcps);

    // All valid MCPs should still be present
    expect(names).toEqual(builtinNames);
  });

  test('MCP configs have required properties', () => {
    const mcps = createBuiltinMcps();

    for (const [_name, config] of Object.entries(mcps)) {
      expect(config).toBeDefined();
      // Each MCP should have either url (remote) or command (local)
      const hasUrl = 'url' in config;
      const hasCommand = 'command' in config;
      expect(hasUrl || hasCommand).toBe(true);
    }
  });

  test('websearch MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const websearch = mcps.websearch;

    expect(websearch).toBeDefined();
    expect('url' in websearch).toBe(true);
  });

  test('context7 MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const context7 = mcps.context7;

    expect(context7).toBeDefined();
    expect('url' in context7).toBe(true);
  });

  test('grep_app MCP has correct structure', () => {
    const mcps = createBuiltinMcps();
    const grep_app = mcps.grep_app;

    expect(grep_app).toBeDefined();
    expect('url' in grep_app).toBe(true);
  });

  test('local MCPs have command arrays', () => {
    const mcps = createBuiltinMcps();

    for (const name of [
      'github',
      'playwright',
      'chrome-devtools',
      'super-productivity',
    ]) {
      const config = mcps[name];
      expect(config).toBeDefined();
      expect('command' in config).toBe(true);
      if ('command' in config) {
        expect(Array.isArray(config.command)).toBe(true);
        expect(config.command.length).toBeGreaterThan(0);
      }
    }
  });

  test('opt-in MCPs are disabled by default', () => {
    const mcps = createBuiltinMcps();

    expect(mcps.github).toMatchObject({ enabled: false });
    expect(mcps.playwright).toMatchObject({ enabled: false });
    expect(mcps['chrome-devtools']).toMatchObject({ enabled: false });
    expect(mcps['microsoft-learn']).toMatchObject({ enabled: false });
    expect(mcps.sentry).toMatchObject({ enabled: false });
    expect(mcps.stripe).toMatchObject({ enabled: false });
    expect(mcps.huggingface).toMatchObject({ enabled: false });
    expect(mcps['super-productivity']).toMatchObject({ enabled: false });
  });

  test('enabled MCPs opt into default-disabled MCPs', () => {
    const mcps = createBuiltinMcps([], undefined, ['playwright', 'sentry']);

    expect(mcps.playwright).not.toHaveProperty('enabled', false);
    expect(mcps.sentry).not.toHaveProperty('enabled', false);
    expect(mcps.github).toMatchObject({ enabled: false });
  });

  test('github MCP does not pass token value as docker argv', () => {
    const mcps = createBuiltinMcps([], undefined, ['github']);
    const github = mcps.github;

    expect('command' in github).toBe(true);
    if ('command' in github) {
      const command = github.command.join(' ');
      expect(command).toContain('export GITHUB_PERSONAL_ACCESS_TOKEN="$token"');
      expect(command).toContain('-e GITHUB_PERSONAL_ACCESS_TOKEN');
      expect(command).not.toContain('-e GITHUB_PERSONAL_ACCESS_TOKEN="$token"');
    }
  });
});
