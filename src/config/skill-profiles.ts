import { getDefaultAgentSkillMap } from '../agents/registry';
import type { PluginConfig } from './schema';
import { getAgentOverride } from './utils';

export const DEFAULT_GLOBAL_SKILLS = [
  'agent-browser',
  'cartography',
  'caveman',
  'clonedeps',
  'context-engineer',
  'deep-research',
  'github-pro',
  'grill-me',
  'grill-with-docs',
  'humanizer',
  'obsidian-cli',
  'omarchy',
  'prompt-craft',
  'prototype',
  'qa',
  'refactor',
  'request-refactor-plan',
  'review-doc-consistency',
  'review-quality',
  'scheduled-tasks',
  'screenshot',
  'session-handoff',
  'simplify',
  'skills-cli',
  'summarization',
  'systematic-debugging',
  'teach',
  'to-issues',
  'to-prd',
  'ubiquitous-language',
  'web-search',
  'writing-plans',
  'zoom-out',
] as const;

export const DEFAULT_AGENT_SKILL_PROFILES: Record<string, readonly string[]> =
  getDefaultAgentSkillMap();

const INTERNAL_AGENTS_WITH_NO_DEFAULT_SKILLS = new Set(['councillor']);

function uniqueSkills(skills: readonly string[]): string[] {
  return Array.from(new Set(skills));
}

export function getDefaultSkillProfileForAgent(agentName: string): string[] {
  return uniqueSkills([
    ...DEFAULT_GLOBAL_SKILLS,
    ...(DEFAULT_AGENT_SKILL_PROFILES[agentName] ?? []),
  ]);
}

export function getDefaultSkillProfilesConfig(): {
  global: string[];
  agents: Record<string, string[]>;
} {
  return {
    global: [...DEFAULT_GLOBAL_SKILLS],
    agents: Object.fromEntries(
      Object.entries(DEFAULT_AGENT_SKILL_PROFILES).map(
        ([agentName, skills]) => [agentName, [...skills]],
      ),
    ),
  };
}

export function resolveAgentSkills(
  config: PluginConfig | undefined,
  agentName: string,
): string[] {
  const explicitSkills = getAgentOverride(config, agentName)?.skills;
  if (explicitSkills !== undefined) {
    return explicitSkills;
  }

  if (INTERNAL_AGENTS_WITH_NO_DEFAULT_SKILLS.has(agentName)) {
    return [];
  }

  const globalSkills = config?.skillProfiles?.global ?? DEFAULT_GLOBAL_SKILLS;
  const agentSkills =
    config?.skillProfiles?.agents?.[agentName] ??
    DEFAULT_AGENT_SKILL_PROFILES[agentName] ??
    [];

  return uniqueSkills([...globalSkills, ...agentSkills]);
}
