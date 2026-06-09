import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getCuratedSkillNamesForAgents,
  materializeCuratedSkills,
} from './managed';

describe('managed skills', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'blacktower-managed-skills-'));
  });

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('curates positive skill names from resolved agent profiles', () => {
    const names = getCuratedSkillNamesForAgents(
      {
        agents: {
          orchestrator: { skills: ['codemap', '!unsafe-skill'] },
          oracle: { skills: ['simplify'] },
        },
      },
      ['orchestrator', 'oracle'],
    );

    expect(names).toEqual(['codemap', 'simplify']);
  });

  test('materializes only curated bundled skill directories', () => {
    const result = materializeCuratedSkills(
      {
        agents: {
          orchestrator: { skills: ['codemap'] },
          oracle: { skills: ['simplify'] },
        },
      },
      ['orchestrator', 'oracle'],
      { targetDir: tmpDir },
    );

    expect(result.copied).toEqual(['codemap', 'simplify']);
    expect(result.missing).toEqual([]);
    expect(readdirSync(tmpDir).sort()).toEqual(['codemap', 'simplify']);
  });

  test('reports configured skills that are not bundled', () => {
    const result = materializeCuratedSkills(
      { agents: { orchestrator: { skills: ['customize-opencode'] } } },
      ['orchestrator'],
      { targetDir: tmpDir },
    );

    expect(result.copied).toEqual([]);
    expect(result.missing).toEqual(['customize-opencode']);
    expect(readdirSync(tmpDir)).toEqual([]);
  });
});
