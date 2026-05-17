import type { PluginConfig } from './schema';
import { getAgentOverride } from './utils';

export const DEFAULT_GLOBAL_SKILLS = [
  'summarization',
  'systematic-debugging',
  'github-pro',
  'deep-research',
  'review-quality',
  'refactor',
  'simplify',
  'writing-plans',
  'session-handoff',
  'context-engineer',
  'prompt-craft',
  'review-doc-consistency',
] as const;

export const DEFAULT_AGENT_SKILL_PROFILES: Record<string, readonly string[]> = {
  orchestrator: [
    'codemap',
    'clonedeps',
    'requirements-interview',
    'customize-opencode',
    'cartography',
    'dependency-upgrade',
    'changelog-automation',
    'observe-and-tune',
    'parallel-feature-development',
    'team-composition-patterns',
    'team-communication-protocols',
    'triage',
    'setup-matt-pocock-skills',
    'skill-creator',
    'skills-cli',
    'mcp-builder',
    'opensource-guide-coach',
    'good-thinking',
    'hads',
  ],
  oracle: [
    'requesting-code-review',
    'improve-codebase-architecture',
    'multi-reviewer-patterns',
    'review-doc-consistency',
    'security-threat-model',
    'security-best-practices',
    'security-ownership-map',
    'secrets-management',
    'sast-configuration',
    'architecture-patterns',
    'api-design-principles',
    'auth-implementation-patterns',
    'nodejs-backend-patterns',
    'workflow-orchestration-patterns',
    'cqrs-implementation',
    'distributed-tracing',
    'slo-implementation',
    'postgres-pro',
    'postgres-data-quality',
    'hybrid-search-implementation',
    'database-migration',
    'dependency-upgrade',
    'git-advanced-workflows',
    'binary-analysis-patterns',
    'protocol-reverse-engineering',
  ],
  librarian: [
    'web-search',
    'openai-docs',
    'context-engineer',
    'cartography',
    'claim-investigation',
    'fact-check',
    'customer-research',
    'competitor-profiling',
    'competitive-landscape',
    'content-strategy',
    'seo-pro',
    'opensource-guide-coach',
    'ebook-analysis',
    'readme-i18n',
    'hads',
    'doc',
    'pdf',
    'spreadsheet',
    'sentry',
  ],
  explorer: [
    'cartography',
    'claim-investigation',
    'fact-check',
    'competitive-landscape',
    'competitor-profiling',
    'customer-research',
    'review-doc-consistency',
    'security-ownership-map',
    'protocol-reverse-engineering',
    'binary-analysis-patterns',
    'postgres-pro',
    'sentry',
    'web-search',
    'hads',
  ],
  designer: [
    'frontend-design',
    'react-pro',
    'react-native-pro',
    'webapp-testing',
    'agent-browser',
    'use-my-browser',
    'wcag-audit-patterns',
    'subcult-visual-design',
    'presentation-design',
    'image',
    'video',
    'screenshot',
    'copywriting',
    'page-cro',
    'marketing-psychology',
    'develop-web-game',
    'game-design-theory',
    'opentui',
    'vscode-ext-commands',
    'vscode-ext-localization',
  ],
  fixer: [
    'tdd',
    'typescript-pro',
    'python-testing-patterns',
    'python-tooling-patterns',
    'python-configuration',
    'uv-package-manager',
    'golang-pro',
    'rust-pro',
    'cli-developer',
    'nodejs-backend-patterns',
    'api-design-principles',
    'auth-implementation-patterns',
    'database-migration',
    'postgres-pro',
    'postgres-data-quality',
    'stripe-integration',
    'websocket-engineer',
    'workflow-orchestration-patterns',
    'rag-implementation',
    'hybrid-search-implementation',
    'llm-evaluation',
    'mcp-builder',
    'bash-defensive-patterns',
    'bats-testing-patterns',
    'shellcheck-configuration',
    'temporal-python-testing',
    'webapp-testing',
    'develop-userscripts',
    'develop-web-game',
    'opentui',
  ],
  council: [
    'good-thinking',
    'multi-reviewer-patterns',
    'blind-spot-detective',
    'fact-check',
    'competitive-landscape',
    'marketing-psychology',
    'data-storytelling',
    'technology-impact',
    'security-threat-model',
    'architecture-patterns',
    'improve-codebase-architecture',
    'worldbuilding',
    'story-sense',
    'naming',
  ],
};

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
