import { getDefaultSkillProfileForAgent } from '../config/skill-profiles';

/**
 * Get permission presets for a specific agent based on code-owned skill profiles.
 * @param agentName - The name of the agent
 * @param skillList - Optional explicit list of skills to allow (overrides recommendations)
 * @returns Permission rules for the skill permission type
 */
export function getSkillPermissionsForAgent(
  agentName: string,
  skillList?: string[],
): Record<string, 'allow' | 'ask' | 'deny'> {
  // All agents start deny-by-default. Generated permissions then allow the
  // resolved skill profile unless user config provides an explicit skill list
  // (including '*').
  const permissions: Record<string, 'allow' | 'ask' | 'deny'> = {
    '*': 'deny',
  };

  // If the user provided an explicit skill list (even empty), honor it
  if (skillList) {
    permissions['*'] = 'deny';
    const deniedSkills = new Set<string>();
    for (const name of skillList) {
      if (name === '*') {
        permissions['*'] = 'allow';
      } else if (name.startsWith('!')) {
        deniedSkills.add(name.slice(1));
      } else {
        permissions[name] = 'allow';
      }
    }
    for (const name of deniedSkills) {
      permissions[name] = 'deny';
    }
    return permissions;
  }

  for (const skillName of getDefaultSkillProfileForAgent(agentName)) {
    permissions[skillName] = 'allow';
  }

  return permissions;
}
