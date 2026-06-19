import { applyRuntimePresetScalarField } from '../plugin/assembly';
import { DEFAULT_AGENT_MCPS } from './agent-mcps';
import { AGENT_ALIASES, DEFAULT_MODELS } from './constants';
import { deepMerge, mergeAgentOverridesByResolvedName } from './loader';
import {
  getActiveRuntimePreset,
  getPreviousRuntimePreset,
  rollbackRuntimePreset,
  setActiveRuntimePreset,
  setActiveRuntimePresetWithPrevious,
} from './runtime-preset';
import {
  getRuntimePresetBaselineAgents,
  hasRuntimePresetBaselineAgents,
} from './runtime-preset-baseline';
import type { AgentOverrideConfig, PluginConfig, Preset } from './schema';
import { resolveAgentSkills } from './skill-profiles';

export type RuntimePresetAgentUpdate = {
  model?: string;
  temperature?: number;
  variant?: string;
  options?: Record<string, unknown>;
};

export type RuntimePresetSwitchPlan = {
  activePreset: string | null;
  previousPreset: string | null;
  presetUpdates: Record<string, RuntimePresetAgentUpdate>;
  resetAgentNames: string[];
  updates: Record<string, RuntimePresetAgentUpdate>;
};

export function getRuntimePresetState(config: PluginConfig): string | null {
  const activePreset = getActiveRuntimePreset();
  if (activePreset && config.presets?.[activePreset]) return activePreset;
  if (config.preset && config.presets?.[config.preset]) return config.preset;
  return null;
}

export function syncRuntimePresetFromConfig(config: PluginConfig): void {
  const activePreset = getActiveRuntimePreset();
  if (activePreset && !config.presets?.[activePreset]) {
    setActiveRuntimePreset(null);
    return;
  }

  if (!activePreset && config.preset && config.presets?.[config.preset]) {
    setActiveRuntimePreset(config.preset);
  }
}

export function createRuntimePresetEffectiveConfig(
  config: PluginConfig,
): PluginConfig {
  const runtimePresetName = getActiveRuntimePreset();
  if (!runtimePresetName || !config.presets?.[runtimePresetName]) return config;

  if (
    runtimePresetName === config.preset &&
    hasRuntimePresetBaselineAgents(config)
  ) {
    return config;
  }

  return {
    ...config,
    preset: runtimePresetName,
    agents: mergeAgentOverridesByResolvedName(
      getBaselineAgents(config),
      config.presets[runtimePresetName],
    ),
  };
}

export function validateRuntimePresetSwitch(
  config: PluginConfig,
  presets: Record<string, Preset>,
  fromPresetName: string | null,
  toPresetName: string,
): string[] {
  const toPreset = presets[toPresetName];
  const fromPreset = fromPresetName ? presets[fromPresetName] : undefined;
  const fields = new Set<string>();

  if (hasChangedMcps(config, fromPreset, toPreset)) fields.add('mcps');
  if (hasChangedSkills(config, fromPreset, toPreset)) fields.add('skills');
  for (const field of [
    'displayName',
    'prompt',
    'orchestratorPrompt',
  ] as const) {
    if (hasChangedScalarField(config, fromPreset, toPreset, field))
      fields.add(field);
  }

  return Array.from(fields).sort();
}

export function buildRuntimePresetSwitchPlan(
  config: PluginConfig,
  presetName: string,
): RuntimePresetSwitchPlan | { error: string } {
  const presets = config.presets ?? {};
  const preset = presets[presetName];
  if (!preset) {
    const available = Object.keys(presets);
    return {
      error:
        available.length > 0
          ? `Preset "${presetName}" not found. Available presets: ${available.join(', ')}`
          : `Preset "${presetName}" not found. No presets configured. Define presets in blacktower.jsonc.`,
    };
  }

  const activePreset = getRuntimePresetState(config);
  const pluginScopedFields = validateRuntimePresetSwitch(
    config,
    presets,
    activePreset,
    presetName,
  );
  if (pluginScopedFields.length > 0) {
    return {
      error:
        `Preset "${presetName}" changes plugin-scoped fields (${pluginScopedFields.join(', ')}). ` +
        'Edit the active preset in config and restart OpenCode to apply skills, display names, or prompt changes.',
    };
  }

  const presetUpdates = buildRuntimePresetPresetUpdates(preset);
  applySameAgentModelResets(config, activePreset, preset, presetUpdates);
  const resetUpdates = buildRuntimePresetResetUpdates(
    config,
    activePreset,
    presetUpdates,
  );
  const updates = { ...resetUpdates, ...presetUpdates };
  if (Object.keys(updates).length === 0) {
    return {
      error: `Preset "${presetName}" is empty (no agent overrides defined).`,
    };
  }

  return {
    activePreset: presetName,
    previousPreset: activePreset,
    presetUpdates,
    resetAgentNames: Object.keys(resetUpdates),
    updates,
  };
}

export function commitRuntimePresetSwitch(presetName: string): void {
  setActiveRuntimePresetWithPrevious(presetName);
}

export function rollbackRuntimePresetSwitch(previous: string | null): void {
  rollbackRuntimePreset(previous);
}

export function applyRuntimePresetConfigHook(
  config: PluginConfig,
  configAgent: Record<string, Record<string, unknown>>,
): void {
  const runtimePresetName = getActiveRuntimePreset();
  if (!runtimePresetName || !config.presets?.[runtimePresetName]) return;

  const runtimePreset = config.presets[runtimePresetName];
  const prevPresetName = getPreviousRuntimePreset();
  const prevPreset = prevPresetName
    ? config.presets?.[prevPresetName]
    : undefined;

  for (const [agentName, override] of Object.entries(runtimePreset)) {
    const resolvedName = AGENT_ALIASES[agentName] ?? agentName;
    const entry = configAgent[resolvedName];
    if (!entry) continue;
    const baseline = getBaselineOverrideForResolvedAgent(config, resolvedName);
    const effectiveOverride = getConfigHookPresetOverride(
      config,
      runtimePresetName,
      resolvedName,
      override,
    );
    const previousOverride = prevPreset
      ? getPresetOverrideForResolvedAgent(prevPreset, resolvedName)
      : undefined;
    applyRuntimePresetEntry(
      entry,
      resolvedName,
      effectiveOverride,
      previousOverride,
      baseline,
    );
  }

  if (prevPresetName && config.presets?.[prevPresetName]) {
    const prevPreset = config.presets[prevPresetName];
    const newPresetResolved = new Set(
      Object.keys(runtimePreset).map((key) => AGENT_ALIASES[key] ?? key),
    );
    for (const agentName of Object.keys(prevPreset)) {
      const resolvedName = AGENT_ALIASES[agentName] ?? agentName;
      if (newPresetResolved.has(resolvedName)) continue;
      const entry = configAgent[resolvedName];
      if (!entry) continue;
      const baseline = getBaselineOverrideForResolvedAgent(
        config,
        resolvedName,
      );
      const prevOverride = prevPreset[agentName] as
        | AgentOverrideConfig
        | undefined;
      applyRuntimePresetReset(entry, resolvedName, baseline, prevOverride);
    }
  }
}

function buildRuntimePresetPresetUpdates(
  preset: Preset,
): Record<string, RuntimePresetAgentUpdate> {
  const updates: Record<string, RuntimePresetAgentUpdate> = {};
  for (const [agentName, override] of Object.entries(preset)) {
    const resolvedName = AGENT_ALIASES[agentName] ?? agentName;
    const agentConfig = mapOverrideToAgentConfig(override);
    if (Object.keys(agentConfig).length > 0)
      updates[resolvedName] = agentConfig;
  }

  return updates;
}

function buildRuntimePresetResetUpdates(
  config: PluginConfig,
  activePreset: string | null,
  presetUpdates: Record<string, RuntimePresetAgentUpdate>,
): Record<string, RuntimePresetAgentUpdate> {
  const updates: Record<string, RuntimePresetAgentUpdate> = {};
  if (activePreset && config.presets?.[activePreset]) {
    const oldPreset = config.presets[activePreset];
    for (const rawName of Object.keys(oldPreset)) {
      const resolvedOld = AGENT_ALIASES[rawName] ?? rawName;
      if (resolvedOld in presetUpdates) continue;
      const baseline = getBaselineOverrideForResolvedAgent(config, resolvedOld);
      const previousOverride = getPresetOverrideForResolvedAgent(
        oldPreset,
        resolvedOld,
      );
      const resetConfig = baseline
        ? mapOverrideToAgentConfig(baseline)
        : mapPluginDefaultToAgentConfig(resolvedOld);
      if (!resetConfig.model && getSelectedModel(previousOverride).model) {
        const defaultReset = mapPluginDefaultToAgentConfig(resolvedOld);
        if (defaultReset.model) resetConfig.model = defaultReset.model;
      }
      if (Object.keys(resetConfig).length > 0)
        updates[resolvedOld] = resetConfig;
    }
  }

  return updates;
}

function getConfigHookPresetOverride(
  config: PluginConfig,
  presetName: string,
  resolvedName: string,
  override: AgentOverrideConfig,
): AgentOverrideConfig {
  if (presetName !== config.preset || !hasRuntimePresetBaselineAgents(config)) {
    return override;
  }
  const baseline = getBaselineOverrideForResolvedAgent(config, resolvedName);
  return baseline
    ? (deepMerge(override, baseline) as AgentOverrideConfig)
    : override;
}

function applySameAgentModelResets(
  config: PluginConfig,
  activePreset: string | null,
  preset: Preset,
  presetUpdates: Record<string, RuntimePresetAgentUpdate>,
): void {
  if (!activePreset || !config.presets?.[activePreset]) return;
  const previousPreset = config.presets[activePreset];
  for (const rawName of Object.keys(preset)) {
    const resolvedName = AGENT_ALIASES[rawName] ?? rawName;
    const previousOverride = getPresetOverrideForResolvedAgent(
      previousPreset,
      resolvedName,
    );
    if (!getSelectedModel(previousOverride).model) continue;
    const update = presetUpdates[resolvedName];
    if (!update || update.model) continue;
    const baseline = getBaselineOverrideForResolvedAgent(config, resolvedName);
    const resetModel = getModelResetForAgent(resolvedName, baseline);
    if (resetModel) update.model = resetModel;
  }
}

function getModelResetForAgent(
  agentName: string,
  baseline: AgentOverrideConfig | undefined,
): string | undefined {
  return (
    getSelectedModel(baseline).model ??
    mapPluginDefaultToAgentConfig(agentName).model
  );
}

function mapPluginDefaultToAgentConfig(
  agentName: string,
): RuntimePresetAgentUpdate {
  const model = DEFAULT_MODELS[agentName as keyof typeof DEFAULT_MODELS];
  return typeof model === 'string' ? { model } : {};
}

function mapOverrideToAgentConfig(
  override: AgentOverrideConfig,
): RuntimePresetAgentUpdate {
  const agentConfig: RuntimePresetAgentUpdate = {};
  const selectedModel = getSelectedModel(override);
  if (selectedModel.model) agentConfig.model = selectedModel.model;
  if (selectedModel.variant) agentConfig.variant = selectedModel.variant;
  if (typeof override.temperature === 'number')
    agentConfig.temperature = override.temperature;
  if (typeof override.variant === 'string')
    agentConfig.variant = override.variant;
  if (
    override.options &&
    typeof override.options === 'object' &&
    !Array.isArray(override.options)
  ) {
    agentConfig.options = override.options;
  }
  return agentConfig;
}

function applyRuntimePresetEntry(
  entry: Record<string, unknown>,
  resolvedName: string,
  override: AgentOverrideConfig,
  previousOverride: AgentOverrideConfig | undefined,
  baseline: AgentOverrideConfig | undefined,
): void {
  const selectedModel = getSelectedModel(override);
  if (selectedModel.model) entry.model = selectedModel.model;
  else if (getSelectedModel(previousOverride).model) {
    const resetModel = getModelResetForAgent(resolvedName, baseline);
    if (resetModel) entry.model = resetModel;
  }
  applyRuntimePresetVariantField(
    entry,
    override,
    previousOverride,
    baseline,
    selectedModel.variant,
  );
  applyRuntimePresetScalarField(
    entry,
    override,
    previousOverride,
    baseline,
    'temperature',
    'number',
  );
  if (
    override.options &&
    typeof override.options === 'object' &&
    !Array.isArray(override.options)
  ) {
    entry.options = override.options;
  } else if ('options' in override || previousOverride?.options) {
    if (baseline?.options) entry.options = baseline.options;
    else delete entry.options;
  }
}

function applyRuntimePresetReset(
  entry: Record<string, unknown>,
  resolvedName: string,
  baseline: AgentOverrideConfig | undefined,
  prevOverride: AgentOverrideConfig | undefined,
): void {
  const baselineModel = getSelectedModel(baseline);
  if (baselineModel.model) {
    entry.model = baselineModel.model;
  } else if (prevOverride && 'model' in prevOverride) {
    const defaultModel =
      DEFAULT_MODELS[resolvedName as keyof typeof DEFAULT_MODELS];
    if (typeof defaultModel === 'string') entry.model = defaultModel;
  }
  if (typeof baseline?.variant === 'string') entry.variant = baseline.variant;
  else if (baselineModel.variant) entry.variant = baselineModel.variant;
  else if (hasPresetVariant(prevOverride)) delete entry.variant;
  if (typeof baseline?.temperature === 'number')
    entry.temperature = baseline.temperature;
  else if (prevOverride && 'temperature' in prevOverride)
    delete entry.temperature;
  if (
    baseline?.options &&
    typeof baseline.options === 'object' &&
    !Array.isArray(baseline.options)
  ) {
    entry.options = baseline.options;
  } else if (prevOverride && 'options' in prevOverride) {
    delete entry.options;
  }
}

function applyRuntimePresetVariantField(
  entry: Record<string, unknown>,
  override: AgentOverrideConfig,
  previousOverride: AgentOverrideConfig | undefined,
  baseline: AgentOverrideConfig | undefined,
  inlineModelVariant: string | undefined,
): void {
  if (typeof override.variant === 'string') {
    entry.variant = override.variant;
    return;
  }
  if (inlineModelVariant) {
    entry.variant = inlineModelVariant;
    return;
  }

  if ('variant' in override || hasPresetVariant(previousOverride)) {
    const baselineVariant = getSelectedModel(baseline).variant;
    if (typeof baseline?.variant === 'string') entry.variant = baseline.variant;
    else if (baselineVariant) entry.variant = baselineVariant;
    else delete entry.variant;
  }
}

function hasPresetVariant(override: AgentOverrideConfig | undefined): boolean {
  return Boolean(
    override &&
      ('variant' in override ||
        getSelectedModel(override).variant !== undefined),
  );
}

function getSelectedModel(override: AgentOverrideConfig | undefined): {
  model?: string;
  variant?: string;
} {
  if (typeof override?.model === 'string') return { model: override.model };
  if (Array.isArray(override?.model) && override.model.length > 0) {
    const first = override.model[0];
    return typeof first === 'string'
      ? { model: first }
      : { model: first.id, variant: first.variant };
  }
  return {};
}

function hasChangedMcps(
  config: PluginConfig,
  fromPreset: Preset | undefined,
  toPreset: Preset,
) {
  const agentNames = getResolvedPresetAgentNames(fromPreset, toPreset);
  for (const agentName of agentNames) {
    const fromMcps = getEffectivePresetMcps(config, fromPreset, agentName);
    const toMcps = getEffectivePresetMcps(config, toPreset, agentName);
    if (JSON.stringify(fromMcps) !== JSON.stringify(toMcps)) return true;
  }
  return false;
}

function hasChangedSkills(
  config: PluginConfig,
  fromPreset: Preset | undefined,
  toPreset: Preset,
) {
  const agentNames = getResolvedPresetAgentNames(fromPreset, toPreset);
  for (const agentName of agentNames) {
    const fromSkills = getEffectivePresetSkills(config, fromPreset, agentName);
    const toSkills = getEffectivePresetSkills(config, toPreset, agentName);
    if (JSON.stringify(fromSkills) !== JSON.stringify(toSkills)) return true;
  }
  return false;
}

function hasChangedScalarField(
  config: PluginConfig,
  fromPreset: Preset | undefined,
  toPreset: Preset,
  field: 'displayName' | 'prompt' | 'orchestratorPrompt',
) {
  const agentNames = getResolvedPresetAgentNames(fromPreset, toPreset);
  for (const agentName of agentNames) {
    if (
      getEffectivePresetOverride(config, fromPreset, agentName)?.[field] !==
      getEffectivePresetOverride(config, toPreset, agentName)?.[field]
    )
      return true;
  }
  return false;
}

function getResolvedPresetAgentNames(
  fromPreset: Preset | undefined,
  toPreset: Preset,
): Set<string> {
  return new Set(
    [...Object.keys(fromPreset ?? {}), ...Object.keys(toPreset)].map(
      (agentName) => AGENT_ALIASES[agentName] ?? agentName,
    ),
  );
}

function getEffectivePresetMcps(
  config: PluginConfig,
  preset: Preset | undefined,
  resolvedName: string,
): string[] {
  const explicitMcps = getEffectivePresetOverride(
    config,
    preset,
    resolvedName,
  )?.mcps;
  if (explicitMcps !== undefined) return explicitMcps;
  return (
    DEFAULT_AGENT_MCPS[resolvedName as keyof typeof DEFAULT_AGENT_MCPS] ?? []
  );
}

function getEffectivePresetSkills(
  config: PluginConfig,
  preset: Preset | undefined,
  resolvedName: string,
): string[] {
  const explicitSkills = getEffectivePresetOverride(
    config,
    preset,
    resolvedName,
  )?.skills;
  if (explicitSkills !== undefined) return explicitSkills;
  return resolveAgentSkills(
    { skillProfiles: config.skillProfiles },
    resolvedName,
  );
}

function getEffectivePresetOverride(
  config: PluginConfig,
  preset: Preset | undefined,
  resolvedName: string,
): AgentOverrideConfig | undefined {
  const baseline = getBaselineOverrideForResolvedAgent(config, resolvedName);
  const override = getPresetOverrideForResolvedAgent(preset, resolvedName);
  if (!baseline) return override;
  if (!override) return baseline;
  return { ...baseline, ...override };
}

function getBaselineAgents(config: PluginConfig): PluginConfig['agents'] {
  return hasRuntimePresetBaselineAgents(config)
    ? getRuntimePresetBaselineAgents(config)
    : config.agents;
}

function getBaselineOverrideForResolvedAgent(
  config: PluginConfig,
  resolvedName: string,
): AgentOverrideConfig | undefined {
  const baselineAgents = getBaselineAgents(config);
  for (const [agentName, override] of Object.entries(baselineAgents ?? {})) {
    if ((AGENT_ALIASES[agentName] ?? agentName) === resolvedName)
      return override;
  }
  return undefined;
}

function getPresetOverrideForResolvedAgent(
  preset: Preset | undefined,
  resolvedName: string,
): AgentOverrideConfig | undefined {
  if (!preset) return undefined;
  for (const [agentName, override] of Object.entries(preset)) {
    if ((AGENT_ALIASES[agentName] ?? agentName) === resolvedName)
      return override;
  }
  return undefined;
}
