import { describe, expect, test } from 'bun:test';
import { buildIncludeArg, buildTree, shellEscape } from './helpers';

describe('github helpers', () => {
  test('shellEscape handles single quotes', () => {
    expect(shellEscape(`a'b`)).toBe(`'a'\\''b'`);
    expect(shellEscape(42)).toBe(`'42'`);
  });

  test('buildIncludeArg supports single and grouped include filters', () => {
    expect(buildIncludeArg()).toBe('');
    expect(buildIncludeArg('ts')).toBe(" -g '*.ts'");
    expect(buildIncludeArg('test')).toBe(" -g '*.test.*' -g '*.spec.*'");
    expect(buildIncludeArg('ts,md')).toBe(" -g '*.ts' -g '*.md'");
    expect(buildIncludeArg('src/**/*.ts')).toBe(" -g 'src/**/*.ts'");
  });

  test('buildTree collapses duplicates and respects depth', () => {
    const files = [
      'src/toolkits/github/index.ts',
      'src/toolkits/github/helpers.ts',
      'src/index.ts',
      'README.md',
    ].join('\n');

    expect(buildTree(files, 2)).toBe(
      ['src', '  toolkits', '  index.ts', 'README.md'].join('\n'),
    );
  });
});
