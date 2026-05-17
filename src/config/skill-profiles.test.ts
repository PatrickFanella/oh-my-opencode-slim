import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    expect(orchestratorSkills).toContain('summarization');
    expect(orchestratorSkills).toContain('systematic-debugging');
    expect(orchestratorSkills).toContain('review-quality');
    expect(orchestratorSkills).toContain('codemap');
    expect(orchestratorSkills).toContain('customize-opencode');
    expect(orchestratorSkills).toContain('team-composition-patterns');

    expect(getDefaultSkillProfileForAgent('designer')).toContain(
      'agent-browser',
    );
    expect(getDefaultSkillProfileForAgent('designer')).toContain(
      'wcag-audit-patterns',
    );
    expect(getDefaultSkillProfileForAgent('oracle')).toContain(
      'review-quality',
    );
    expect(getDefaultSkillProfileForAgent('oracle')).toContain(
      'security-threat-model',
    );
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
});
