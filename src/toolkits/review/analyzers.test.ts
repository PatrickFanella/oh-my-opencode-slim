import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  classifyChangedFiles,
  findCoverageGaps,
  findDeadExports,
  recommendReviewTools,
  summarizeComplexitySignals,
} from './analyzers';

function makeProject(): string {
  return mkdtempSync(join(tmpdir(), 'review-analyzers-'));
}

function write(project: string, relPath: string, content: string): void {
  const fullPath = join(project, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

describe('review analyzers', () => {
  test('flags complexity hotspots', () => {
    const project = makeProject();
    write(
      project,
      'src/hot.ts',
      Array.from({ length: 260 }, (_, idx) => `const x${idx} = ${idx};`).join(
        '\n',
      ),
    );

    const hotspots = summarizeComplexitySignals(project);
    expect(hotspots.some((line) => line.startsWith('src/hot.ts:'))).toBe(true);
  });

  test('finds coverage gaps while skipping scripts', () => {
    const project = makeProject();
    write(project, 'src/alpha.ts', 'export const alpha = true;');
    write(project, 'src/alpha.test.ts', 'test("x", () => {});');
    write(project, 'src/beta.ts', 'export const beta = true;');
    write(project, 'scripts/tool.ts', 'export const script = true;');

    expect(findCoverageGaps(project)).toEqual(['src/beta.ts']);
  });

  test('finds dead exports with no external usage', () => {
    const project = makeProject();
    write(
      project,
      'src/a.ts',
      [
        'export function used() {',
        '  return 1;',
        '}',
        'export const dead = 1;',
      ].join('\n'),
    );
    write(
      project,
      'src/b.ts',
      [
        "import { used } from './a';",
        'export function run() {',
        '  return used();',
        '}',
      ].join('\n'),
    );

    const dead = findDeadExports(project);
    expect(dead).toContain('src/a.ts: dead');
    expect(dead).not.toContain('src/a.ts: used');
  });

  test('classifies changed files and suggests review tools', () => {
    const buckets = classifyChangedFiles([
      'src/index.ts',
      'src/index.test.ts',
      'docs/toolkits.md',
      'biome.json',
    ]);

    expect(buckets).toEqual({
      code: ['src/index.ts'],
      tests: ['src/index.test.ts'],
      docs: ['docs/toolkits.md'],
      config: ['biome.json'],
    });

    expect(recommendReviewTools(buckets)).toEqual([
      'review_diff',
      'review_summary',
      'review_complexity',
      'review_todos',
    ]);
  });
});
