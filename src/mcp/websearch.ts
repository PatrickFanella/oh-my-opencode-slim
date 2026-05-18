import type { WebsearchConfig } from '../config';
import type { RemoteMcpConfig } from './types';

const TAVILY_API_KEY_CONFIG_TOKEN = '$' + '{TAVILY_API_KEY}';

/**
 * Creates a websearch MCP config based on the provided configuration.
 * Supports Exa (default) and Tavily providers.
 * @see https://exa.ai  @see https://tavily.com
 */
export function createWebsearchConfig(
  config?: WebsearchConfig,
): RemoteMcpConfig {
  const provider = config?.provider || 'exa';

  if (provider === 'tavily') {
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) {
      throw new Error(
        'TAVILY_API_KEY environment variable is required for Tavily provider',
      );
    }
    return {
      type: 'remote',
      url: 'https://mcp.tavily.com/mcp/',
      headers: {
        Authorization: `Bearer ${tavilyKey}`,
      },
      oauth: false,
    };
  }

  // Default: Exa provider
  // Prefer exaApiKey in URL (reliably validated by Exa MCP endpoint)
  // Fall back to anonymous access when no key is available
  const exaKey = process.env.EXA_API_KEY;
  const exaUrl = exaKey
    ? `https://mcp.exa.ai/mcp?tools=web_search_exa&exaApiKey=${encodeURIComponent(exaKey)}`
    : 'https://mcp.exa.ai/mcp?tools=web_search_exa';

  return {
    type: 'remote',
    url: exaUrl,
    oauth: false,
  };
}

/**
 * Creates a host OpenCode MCP config for websearch.
 *
 * This deliberately avoids embedding process env secrets into opencode.json.
 * Host config can handle OAuth/headers in OpenCode's native MCP flow, while
 * plugin-provided MCP definitions cannot reliably authenticate remote MCPs.
 */
export function createHostWebsearchConfig(
  config?: WebsearchConfig,
): RemoteMcpConfig {
  const provider = config?.provider || 'exa';

  if (provider === 'tavily') {
    return {
      type: 'remote',
      url: 'https://mcp.tavily.com/mcp/',
      headers: {
        Authorization: `Bearer ${TAVILY_API_KEY_CONFIG_TOKEN}`,
      },
      oauth: false,
    };
  }

  return {
    type: 'remote',
    url: 'https://mcp.exa.ai/mcp?tools=web_search_exa',
  };
}

// Backward compatibility: default export using default (Exa) config
export const websearch: RemoteMcpConfig = createWebsearchConfig();
