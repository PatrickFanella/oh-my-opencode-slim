import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_BOARD_AGENT_DEFINITIONS } from '../agents/default-board-agents';
import { CUSTOM_SKILLS } from '../cli/custom-skills';
import {
  DEFAULT_AGENT_SKILL_PROFILES,
  DEFAULT_GLOBAL_SKILLS,
  getDefaultSkillProfileForAgent,
  resolveAgentSkills,
} from './skill-profiles';

describe('skill profiles', () => {
  test('default profiles include global skills and agent-specific skills', () => {
    const orchestratorSkills = getDefaultSkillProfileForAgent('orchestrator');
    expect(orchestratorSkills).toContain('almaz');
    expect(orchestratorSkills).toContain('gitea-repo-overhaul');
    expect(orchestratorSkills).toContain('homelab');
    expect(orchestratorSkills).toContain('nuc');
    expect(orchestratorSkills).toContain('super-productivity-maintenance');
    expect(orchestratorSkills).toContain('super-productivity-planning');
    expect(orchestratorSkills).toContain('summarization');
    expect(orchestratorSkills).toContain('systematic-debugging');
    expect(orchestratorSkills).toContain('review-quality');
    expect(orchestratorSkills).toContain('cartography');
    expect(orchestratorSkills).toContain('customize-opencode');
    expect(orchestratorSkills).toContain('team-composition-patterns');
    expect(orchestratorSkills).toContain('imagegen');
    expect(orchestratorSkills).toContain('skill-installer');
    expect(orchestratorSkills).toContain('switchyard-runtime');

    for (const skill of CUSTOM_SKILLS) {
      expect(
        orchestratorSkills,
        `orchestrator includes bundled skill ${skill.name}`,
      ).toContain(skill.name);
    }

    expect(getDefaultSkillProfileForAgent('designer')).toContain(
      'agent-browser',
    );
    expect(getDefaultSkillProfileForAgent('designer')).not.toContain('almaz');
    expect(getDefaultSkillProfileForAgent('designer')).not.toContain('homelab');
    expect(getDefaultSkillProfileForAgent('designer')).not.toContain('nuc');
    expect(getDefaultSkillProfileForAgent('designer')).toContain(
      'wcag-audit-patterns',
    );
    expect(getDefaultSkillProfileForAgent('designer')).toContain('imagegen');
    expect(getDefaultSkillProfileForAgent('oracle')).toContain(
      'review-quality',
    );
    expect(getDefaultSkillProfileForAgent('oracle')).toContain(
      'security-threat-model',
    );
    expect(getDefaultSkillProfileForAgent('oracle')).toContain('almaz');
    expect(getDefaultSkillProfileForAgent('oracle')).toContain(
      'gitea-repo-overhaul',
    );
    expect(getDefaultSkillProfileForAgent('oracle')).toContain('homelab');
    expect(getDefaultSkillProfileForAgent('oracle')).toContain('nuc');
    expect(getDefaultSkillProfileForAgent('oracle')).toContain(
      'switchyard-runtime',
    );
  });

  test('default global, built-in, and board profiles assign every bundled skill', () => {
    const assignedSkills = new Set<string>([
      ...DEFAULT_GLOBAL_SKILLS,
      ...Object.values(DEFAULT_AGENT_SKILL_PROFILES).flat(),
      ...DEFAULT_BOARD_AGENT_DEFINITIONS.flatMap(
        (definition) => definition.skills ?? [],
      ),
    ]);

    const unassignedSkills = CUSTOM_SKILLS.map((skill) => skill.name).filter(
      (skill) => !assignedSkills.has(skill),
    );

    expect(unassignedSkills).toEqual([]);
  });

  test('explicit agent skills override profile resolution', () => {
    expect(
      resolveAgentSkills(
        {
          agents: {
            oracle: {
              skills: ['*', '!unsafe-skill'],
            },
          },
        },
        'oracle',
      ),
    ).toEqual(['*', '!unsafe-skill']);
  });

  test('configured skill profiles replace defaults per section', () => {
    expect(
      resolveAgentSkills(
        {
          skillProfiles: {
            global: ['global-one'],
            agents: {
              fixer: ['fixer-one'],
            },
          },
        },
        'fixer',
      ),
    ).toEqual(['global-one', 'fixer-one']);
  });

  test('unknown agents still receive global profile skills', () => {
    expect(resolveAgentSkills({}, 'custom-agent')).toEqual([
      ...DEFAULT_GLOBAL_SKILLS,
    ]);
  });

  test('hidden internal agents do not receive global profile skills by default', () => {
    expect(resolveAgentSkills({}, 'councillor')).toEqual([]);
  });

  test('hidden internal agents can still be explicitly configured', () => {
    expect(
      resolveAgentSkills(
        {
          agents: {
            councillor: {
              skills: ['summarization'],
            },
          },
        },
        'councillor',
      ),
    ).toEqual(['summarization']);
  });

  test('default profiles do not reference removed skills', () => {
    const skillIndex = JSON.parse(
      readFileSync(join(process.cwd(), 'src/skills/index.json'), 'utf-8'),
    ) as { skills: Array<{ name: string }> };
    const knownSkills = new Set([
      ...skillIndex.skills.map((skill) => skill.name),
      ...CUSTOM_SKILLS.map((skill) => skill.name),
      'customize-opencode',
    ]);
    const defaultSkills = [
      ...DEFAULT_GLOBAL_SKILLS,
      ...Object.values(DEFAULT_AGENT_SKILL_PROFILES).flat(),
    ];

    const missingSkills = defaultSkills.filter(
      (skill) => !knownSkills.has(skill),
    );

    expect(missingSkills).toEqual([]);
  });

  test('agent-specific default profiles do not duplicate global skills', () => {
    const globalSkills = new Set<string>(DEFAULT_GLOBAL_SKILLS);

    for (const [agentName, skills] of Object.entries(
      DEFAULT_AGENT_SKILL_PROFILES,
    )) {
      const duplicates = skills.filter((skill) => globalSkills.has(skill));

      expect(duplicates, `${agentName} duplicates global skills`).toEqual([]);
    }
  });

  test('default profiles do not contain duplicate skills within a section', () => {
    expect(new Set(DEFAULT_GLOBAL_SKILLS).size).toBe(
      DEFAULT_GLOBAL_SKILLS.length,
    );

    for (const [agentName, skills] of Object.entries(
      DEFAULT_AGENT_SKILL_PROFILES,
    )) {
      expect(new Set(skills).size, `${agentName} has duplicate skills`).toBe(
        skills.length,
      );
    }
  });
});
