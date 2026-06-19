import type { PluginConfig } from './schema';

const RUNTIME_PRESET_BASELINE_AGENTS = Symbol.for(
  'blacktower.runtimePresetBaselineAgents',
);

type RuntimePresetBaselineCarrier = PluginConfig & {
  [RUNTIME_PRESET_BASELINE_AGENTS]?: PluginConfig['agents'];
};

export function setRuntimePresetBaselineAgents(
  config: PluginConfig,
  agents: PluginConfig['agents'],
): void {
  Object.defineProperty(config, RUNTIME_PRESET_BASELINE_AGENTS, {
    configurable: true,
    enumerable: false,
    value: agents,
    writable: true,
  });
}

export function getRuntimePresetBaselineAgents(
  config: PluginConfig,
): PluginConfig['agents'] {
  return (config as RuntimePresetBaselineCarrier)[
    RUNTIME_PRESET_BASELINE_AGENTS
  ];
}

export function hasRuntimePresetBaselineAgents(config: PluginConfig): boolean {
  return Object.hasOwn(config, RUNTIME_PRESET_BASELINE_AGENTS);
}
