import type { McpName, WebsearchConfig } from '../config';
import { context7 } from './context7';
import { grep_app } from './grep-app';
import type { LocalMcpConfig, McpConfig } from './types';
import { createWebsearchConfig, websearch } from './websearch';

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
  'microsoft-learn': {
    type: 'remote',
    url: 'https://learn.microsoft.com/api/mcp',
  },
  sentry: {
    type: 'remote',
    url: 'https://mcp.sentry.dev/mcp',
  },
  stripe: {
    type: 'remote',
    url: 'https://mcp.stripe.com/',
  },
  huggingface: {
    type: 'remote',
    url: 'https://huggingface.co/mcp?login',
  },
  'super-productivity': {
    type: 'local',
    command: ['sp-mcp'],
  },
  websearch,
  grep_app,
};

const OPT_IN_MCPS = new Set<McpName>([
  'github',
  'playwright',
  'chrome-devtools',
  'microsoft-learn',
  'sentry',
  'stripe',
  'huggingface',
  'super-productivity',
]);

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
    'exec docker run -i --rm',
    '-e GITHUB_PERSONAL_ACCESS_TOKEN',
    'ghcr.io/github/github-mcp-server stdio',
  ].join('\n');

  return {
    type: 'local',
    command: ['bash', '-lc', command],
  };
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
  const enabled = new Set(enabledMcps);
  const mcps = Object.fromEntries(
    Object.entries(allBuiltinMcps)
      .filter(([name]) => !disabledMcps.includes(name))
      .map(([name, config]) => {
        if (OPT_IN_MCPS.has(name as McpName) && !enabled.has(name)) {
          return [name, { ...config, enabled: false }];
        }

        return [name, config];
      }),
  );

  // Override websearch with user-configured provider (default: Exa)
  if (!disabledMcps.includes('websearch')) {
    mcps.websearch = createWebsearchConfig(websearchConfig);
  }

  return mcps;
}
