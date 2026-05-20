import { describe, expect, it } from 'bun:test';
import { getSkillPermissionsForAgent } from './skills';

describe('skills permissions', () => {
  it('should deny wildcard skills for orchestrator by default', () => {
    const permissions = getSkillPermissionsForAgent('orchestrator');
    expect(permissions['*']).toBe('deny');
  });

  it('should deny all skills for other agents by default', () => {
    const permissions = getSkillPermissionsForAgent('designer');
    expect(permissions['*']).toBe('deny');
  });

  it('should allow default profile skills for specific agents', () => {
    // Designer should have agent-browser allowed
    const designerPerms = getSkillPermissionsForAgent('designer');
    expect(designerPerms['agent-browser']).toBe('allow');

    // Oracle should have simplify allowed by default
    const oraclePerms = getSkillPermissionsForAgent('oracle');
    expect(oraclePerms.simplify).toBe('allow');
    expect(oraclePerms['review-quality']).toBe('allow');
    expect(oraclePerms['security-threat-model']).toBe('allow');

    const orchestratorPerms = getSkillPermissionsForAgent('orchestrator');
    expect(orchestratorPerms.almaz).toBe('allow');
    expect(orchestratorPerms.clonedeps).toBe('allow');
    expect(orchestratorPerms.nuc).toBe('allow');
    expect(orchestratorPerms.summarization).toBe('allow');
  });

  it('should keep niche skills denied for unrelated agents', () => {
    const fixerPerms = getSkillPermissionsForAgent('fixer');

    expect(fixerPerms['frontend-design']).toBeUndefined();
    expect(fixerPerms['security-threat-model']).toBeUndefined();
    expect(fixerPerms['*']).toBe('deny');
  });

  it('should honor explicit skill list overrides', () => {
    // Override with empty list
    const emptyPerms = getSkillPermissionsForAgent('orchestrator', []);
    expect(emptyPerms['*']).toBe('deny');
    expect(Object.keys(emptyPerms).length).toBe(1);

    // Override with specific list
    const specificPerms = getSkillPermissionsForAgent('designer', [
      'my-skill',
      '!bad-skill',
    ]);
    expect(specificPerms['*']).toBe('deny');
    expect(specificPerms['my-skill']).toBe('allow');
    expect(specificPerms['bad-skill']).toBe('deny');
  });

  it('should honor wildcard in explicit list', () => {
    const wildcardPerms = getSkillPermissionsForAgent('designer', ['*']);
    expect(wildcardPerms['*']).toBe('allow');
  });

  it('should make explicit deny rules win over later allows', () => {
    const permissions = getSkillPermissionsForAgent('designer', [
      '!unsafe-skill',
      'unsafe-skill',
      '*',
      '!*',
    ]);

    expect(permissions['unsafe-skill']).toBe('deny');
    expect(permissions['*']).toBe('deny');
  });
});
