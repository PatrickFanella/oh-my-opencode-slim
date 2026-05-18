import type { McpName, WebsearchConfig } from '../config';
import { context7 } from './context7';
import { grep_app } from './grep-app';
import type { LocalMcpConfig, McpConfig } from './types';
import {
  createHostWebsearchConfig,
  createWebsearchConfig,
  websearch,
} from './websearch';

export type { LocalMcpConfig, McpConfig, RemoteMcpConfig } from './types';

const allBuiltinMcps: Record<McpName, McpConfig> = {
  github: createGithubMcpConfig(),
  playwright: {
    type: 'local',
    command: [
      'npx',
      '-y',
      '@playwright/mcp@latest',
      '--isolated',
      '--headless',
    ],
  },
  'chrome-devtools': {
    type: 'local',
    command: [
      'npx',
      '-y',
      'chrome-devtools-mcp@latest',
      '--isolated',
      '--headless',
      '--no-usage-statistics',
    ],
  },
  context7,
  stripe: {
    type: 'remote',
    url: 'https://mcp.stripe.com/',
  },
  'super-productivity': {
    type: 'local',
    command: createSuperProductivityCommand(),
    environment: {
      SP_MCP_DATA_DIR: `${process.env.HOME ?? ''}/.local/share/super-productivity-mcp`,
      SP_MCP_LOG_LEVEL: 'info',
    },
  },
  websearch,
  grep_app,
};

function createGithubMcpConfig(): LocalMcpConfig {
  const command = [
    'token="$' + '{GITHUB_PERSONAL_ACCESS_TOKEN:-}"',
    'if [ -z "$token" ] && command -v gh >/dev/null 2>&1; then',
    'token="$(gh auth token 2>/dev/null || true)"',
    'fi',
    'if [ -z "$token" ]; then',
    'printf "GITHUB_PERSONAL_ACCESS_TOKEN or gh auth is required for github MCP\\n" >&2',
    'exit 1',
    'fi',
    'export GITHUB_PERSONAL_ACCESS_TOKEN="$token"',
    'exec docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server stdio',
  ].join('\n');

  return {
    type: 'local',
    command: ['bash', '-lc', command],
  };
}

function createSuperProductivityCommand(): string[] {
  const command = [
    'if [ -x "$HOME/.local/bin/sp-mcp" ]; then',
    'exec "$HOME/.local/bin/sp-mcp"',
    'fi',
    'exec sp-mcp',
  ].join('\n');
  return ['bash', '-lc', command];
}

/**
 * Creates MCP configurations, excluding disabled ones.
 * Accepts an optional websearchConfig to override the default Exa provider.
 */
export function createBuiltinMcps(
  disabledMcps: readonly string[] = [],
  websearchConfig?: WebsearchConfig,
  enabledMcps: readonly string[] = [],
): Record<string, McpConfig> {
  // Kept for config compatibility. Built-in MCPs now start enabled unless
  // explicitly listed in disabledMcps.
  void enabledMcps;
  const mcps = Object.fromEntries(
    Object.entries(allBuiltinMcps)
      .filter(([name]) => !disabledMcps.includes(name))
      .map(([name, config]) => [name, config]),
  );

  // Override websearch with user-configured provider (default: Exa)
  if (!disabledMcps.includes('websearch')) {
    mcps.websearch = createWebsearchConfig(websearchConfig);
  }

  return mcps;
}

/**
 * Creates MCP definitions intended to be written to OpenCode's host config.
 *
 * Remote MCPs that need OAuth/API auth must be configured through OpenCode's
 * native MCP config so the host can manage authentication. This helper is
 * therefore used by the installer/bootstrap path, not the runtime plugin MCP
 * export.
 */
export function createHostBuiltinMcps(
  disabledMcps: readonly string[] = [],
  websearchConfig?: WebsearchConfig,
  enabledMcps: readonly string[] = [],
): Record<string, McpConfig> {
  const mcps = createBuiltinMcps(disabledMcps, websearchConfig, enabledMcps);

  for (const [name, config] of Object.entries(mcps)) {
    if (!('url' in config)) continue;

    const { headers: _headers, oauth: _oauth, ...hostConfig } = config;
    mcps[name] = hostConfig;
  }

  if (!disabledMcps.includes('websearch')) {
    mcps.websearch = createHostWebsearchConfig(websearchConfig);
  }

  return mcps;
}
