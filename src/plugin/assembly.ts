import type { AgentOverrideConfig, Preset } from '../config';
import { AGENT_ALIASES } from '../config/constants';

export function ensureManagedSkillsPath(
  opencodeConfig: Record<string, unknown>,
  managedSkillsPath: string,
): void {
  const skills =
    opencodeConfig.skills &&
    typeof opencodeConfig.skills === 'object' &&
    !Array.isArray(opencodeConfig.skills)
      ? { ...(opencodeConfig.skills as Record<string, unknown>) }
      : {};
  const existingPaths = Array.isArray(skills.paths) ? skills.paths : [];
  const paths = existingPaths.filter(
    (path): path is string => typeof path === 'string',
  );

  if (!paths.includes(managedSkillsPath)) {
    paths.push(managedSkillsPath);
  }

  skills.paths = paths;
  opencodeConfig.skills = skills;
}

export function shouldInheritGlobalPermission(
  opencodeConfig: Record<string, unknown>,
): boolean {
  return opencodeConfig.permission === 'allow';
}

export function omitGeneratedPermission<T extends Record<string, unknown>>(
  agentConfig: T,
): Omit<T, 'permission'> {
  const { permission: _permission, ...rest } = agentConfig;
  return rest;
}

export function getPresetOverrideForResolvedAgent(
  preset: Preset,
  resolvedName: string,
): AgentOverrideConfig | undefined {
  for (const [agentName, override] of Object.entries(preset)) {
    if ((AGENT_ALIASES[agentName] ?? agentName) === resolvedName) {
      return override;
    }
  }

  return undefined;
}

export function applyRuntimePresetScalarField(
  entry: Record<string, unknown>,
  override: AgentOverrideConfig,
  previousOverride: AgentOverrideConfig | undefined,
  baseline: AgentOverrideConfig | undefined,
  field: 'variant' | 'temperature',
  expectedType: 'string' | 'number',
): void {
  if (typeof override[field] === expectedType) {
    entry[field] = override[field];
    return;
  }

  if (field in override || previousOverride?.[field] !== undefined) {
    const baselineValue = baseline?.[field];
    if (typeof baselineValue === expectedType) {
      entry[field] = baselineValue;
    } else {
      delete entry[field];
    }
  }
}
