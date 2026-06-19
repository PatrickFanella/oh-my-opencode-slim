import {
  DEFAULT_MULTIPLEXER_CONFIG,
  type MultiplexerConfig,
  type PluginConfig,
} from './schema';

export type RuntimeMcpPolicy = {
  disabled: string[];
  enabled: string[];
};

export type RuntimeConfig = {
  config: PluginConfig;
  agentConfigs: PluginConfig['agents'];
  mcpPolicy: RuntimeMcpPolicy;
  multiplexer: MultiplexerConfig;
};

export function normalizeMultiplexerConfig(
  config: PluginConfig,
): MultiplexerConfig {
  if (config.multiplexer) {
    return config.multiplexer;
  }

  if (config.tmux) {
    return {
      type: config.tmux.enabled ? 'tmux' : 'none',
      layout: config.tmux.layout ?? DEFAULT_MULTIPLEXER_CONFIG.layout,
      main_pane_size:
        config.tmux.main_pane_size ?? DEFAULT_MULTIPLEXER_CONFIG.main_pane_size,
    };
  }

  return { ...DEFAULT_MULTIPLEXER_CONFIG };
}

export function createRuntimeConfig(config: PluginConfig): RuntimeConfig {
  const multiplexer = normalizeMultiplexerConfig(config);
  const normalizedConfig = {
    ...config,
    multiplexer,
  };

  return {
    config: normalizedConfig,
    agentConfigs: normalizedConfig.agents,
    mcpPolicy: {
      disabled: normalizedConfig.disabled_mcps ?? [],
      enabled: normalizedConfig.enabled_mcps ?? [],
    },
    multiplexer,
  };
}
