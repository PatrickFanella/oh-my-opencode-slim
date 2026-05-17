import { describe, expect, test } from 'bun:test';
import {
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
      'requesting-code-review',
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
});
