import { afterAll, describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CUSTOM_SKILLS, discoverCustomSkills } from './custom-skills';
import { getSkillPermissionsForAgent } from './skills';

describe('custom skills discovery', () => {
  it('includes direct Blacktower skills and migrated catalog skills', () => {
    const names = new Set(CUSTOM_SKILLS.map((skill) => skill.name));

    expect(names.has('almaz')).toBe(true);
    expect(names.has('simplify')).toBe(true);
    expect(names.has('codemap')).toBe(true);
    expect(names.has('clonedeps')).toBe(true);
    expect(names.has('nuc')).toBe(true);
    expect(names.has('typescript-pro')).toBe(true);
    expect(names.has('agent-browser')).toBe(false);
  });

  it('preserves default allowed agents for Blacktower direct skills', () => {
    const byName = new Map(CUSTOM_SKILLS.map((skill) => [skill.name, skill]));

    expect(byName.get('simplify')?.allowedAgents).toEqual(['oracle']);
    expect(byName.get('codemap')?.allowedAgents).toEqual(['orchestrator']);
    expect(byName.get('clonedeps')?.allowedAgents).toEqual(['orchestrator']);
  });

  it('does not auto-allow migrated skills for designer by default', () => {
    const designerPermissions = getSkillPermissionsForAgent('designer');

    expect(designerPermissions['*']).toBe('deny');
    expect(designerPermissions['typescript-pro']).toBeUndefined();
  });

  it('parses YAML block scalar descriptions', () => {
    const caveman = CUSTOM_SKILLS.find((skill) => skill.name === 'caveman');

    expect(caveman?.description).toContain('Ultra-compressed');
    expect(caveman?.description).not.toBe('>');
  });
});

describe('custom skills duplicate handling', () => {
  const tempRoots: string[] = [];

  afterAll(() => {
    for (const root of tempRoots) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function createSkill(skillDir: string, content: string): void {
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, 'SKILL.md'), content, 'utf8');
  }

  it('prefers direct Blacktower path for simplify duplicates', () => {
    const root = mkdtempSync(join(tmpdir(), 'blacktower-skills-'));
    tempRoots.push(root);

    createSkill(
      join(root, 'src/skills/quality-review/simplify'),
      `---\nname: simplify\ndescription: alt\n---\n`,
    );
    createSkill(
      join(root, 'src/skills/simplify'),
      `---\nname: simplify\ndescription: preferred\n---\n`,
    );

    const skills = discoverCustomSkills(root);
    const simplify = skills.find((skill) => skill.name === 'simplify');

    expect(simplify?.sourcePath).toBe('src/skills/simplify');
  });

  it('keeps first deterministic path for non-preferred duplicates', () => {
    const root = mkdtempSync(join(tmpdir(), 'blacktower-skills-'));
    tempRoots.push(root);

    createSkill(
      join(root, 'src/skills/a/one'),
      `---\nname: duplicate\ndescription: first\n---\n`,
    );
    createSkill(
      join(root, 'src/skills/b/two'),
      `---\nname: duplicate\ndescription: second\n---\n`,
    );

    const skills = discoverCustomSkills(root);
    const duplicate = skills.find((skill) => skill.name === 'duplicate');

    expect(duplicate?.sourcePath).toBe('src/skills/a/one');
    expect(duplicate?.description).toBe('first');
  });
});
