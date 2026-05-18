import { describe, expect, test } from 'bun:test';
import { createBuiltinMcps, createHostBuiltinMcps } from './index';

describe('createBuiltinMcps', () => {
  const builtinNames = [
    'github',
    'playwright',
    'chrome-devtools',
    'context7',
    'stripe',
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

  test('all built-in MCPs are enabled by default', () => {
    const mcps = createBuiltinMcps();

    expect(mcps.github).not.toHaveProperty('enabled', false);
    expect(mcps.playwright).not.toHaveProperty('enabled', false);
    expect(mcps['chrome-devtools']).not.toHaveProperty('enabled', false);
    expect(mcps.stripe).not.toHaveProperty('enabled', false);
    expect(mcps['super-productivity']).not.toHaveProperty('enabled', false);
  });

  test('enabled MCPs is backward-compatible and no longer required', () => {
    const mcps = createBuiltinMcps([], undefined, ['playwright', 'stripe']);

    expect(mcps.playwright).not.toHaveProperty('enabled', false);
    expect(mcps.stripe).not.toHaveProperty('enabled', false);
    expect(mcps.github).not.toHaveProperty('enabled', false);
  });

  test('github MCP does not pass token value as docker argv', () => {
    const mcps = createBuiltinMcps([], undefined, ['github']);
    const github = mcps.github;

    expect('command' in github).toBe(true);
    if ('command' in github) {
      const command = github.command.join(' ');
      expect(command).toContain('export GITHUB_PERSONAL_ACCESS_TOKEN="$token"');
      expect(command).toContain('-e GITHUB_PERSONAL_ACCESS_TOKEN');
      expect(command).toContain(
        'docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server stdio',
      );
      expect(command).not.toContain('docker run -i --rm\n-e');
      expect(command).not.toContain('-e GITHUB_PERSONAL_ACCESS_TOKEN="$token"');
    }
  });

  test('super-productivity MCP uses local bridge defaults', () => {
    const mcps = createBuiltinMcps([], undefined, ['super-productivity']);
    const sp = mcps['super-productivity'];

    expect('command' in sp).toBe(true);
    if ('command' in sp) {
      expect(sp.command).toEqual([
        'bash',
        '-lc',
        [
          'if [ -x "$HOME/.local/bin/sp-mcp" ]; then',
          'exec "$HOME/.local/bin/sp-mcp"',
          'fi',
          'exec sp-mcp',
        ].join('\n'),
      ]);
      expect(sp.environment).toMatchObject({
        SP_MCP_LOG_LEVEL: 'info',
      });
      expect(sp.environment?.SP_MCP_DATA_DIR).toContain(
        '/.local/share/super-productivity-mcp',
      );
    }
  });

  test('host MCP definitions avoid plugin-only remote auth suppression', () => {
    const mcps = createHostBuiltinMcps();

    expect(mcps.websearch).toMatchObject({
      type: 'remote',
      url: 'https://mcp.exa.ai/mcp?tools=web_search_exa',
    });
    expect(mcps.websearch).not.toHaveProperty('oauth', false);
    expect(mcps.grep_app).not.toHaveProperty('oauth', false);
    expect(mcps.context7).not.toHaveProperty('headers');
  });
});
