import { type Dirent, existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

export const CODE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
]);

const JS_TS_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

export const TEST_HINTS = ['test', 'tests', 'spec', '__tests__', '__specs__'];

const DEFAULT_IGNORES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
]);

export type ChangedFileBuckets = {
  code: string[];
  tests: string[];
  docs: string[];
  config: string[];
};

export function listFilesRecursive(root: string): string[] {
  const out: string[] = [];

  function walk(current: string): void {
    let entries: Dirent<string>[];
    try {
      entries = readdirSync(current, {
        withFileTypes: true,
        encoding: 'utf8',
      });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (DEFAULT_IGNORES.has(entry.name)) {
        continue;
      }
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      out.push(full);
    }
  }

  walk(root);
  return out;
}

function toAbsoluteFileList(
  directory: string,
  filesOrPath?: string[] | string,
): string[] {
  if (Array.isArray(filesOrPath)) {
    return filesOrPath;
  }

  const root = filesOrPath ? join(directory, filesOrPath) : directory;
  return listFilesRecursive(root);
}

export function summarizeComplexitySignals(
  directory: string,
  filesOrPath?: string[] | string,
): string[] {
  const files = toAbsoluteFileList(directory, filesOrPath);
  const results: string[] = [];

  for (const full of files) {
    if (!CODE_EXTS.has(extname(full))) {
      continue;
    }

    let text = '';
    try {
      text = readFileSync(full, 'utf8');
    } catch {
      continue;
    }

    const rel = relative(directory, full);
    const lines = text.split(/\r?\n/).length;
    const branches = (
      text.match(/\b(if|else if|switch|case|catch|for|while)\b|\?/g) ?? []
    ).length;
    const funcs = (text.match(/\bfunction\b|=>|\bdef\b|\bfunc\b/g) ?? [])
      .length;
    const score = lines + branches * 12 + funcs * 4;

    if (lines >= 250 || branches >= 12 || score >= 450) {
      results.push(
        `${rel}: lines=${lines}, branches=${branches}, funcs=${funcs}, score=${score}`,
      );
    }
  }

  return results.sort((a, b) => {
    const scoreA = Number(a.match(/score=(\d+)/)?.[1] ?? 0);
    const scoreB = Number(b.match(/score=(\d+)/)?.[1] ?? 0);
    return scoreB - scoreA || a.localeCompare(b);
  });
}

export function summarizeLargeFiles(
  directory: string,
  maybePath?: string,
): string[] {
  const root = maybePath ? join(directory, maybePath) : directory;
  const files = listFilesRecursive(root);
  const output: string[] = [];

  for (const full of files) {
    let lineCount = 0;
    try {
      lineCount = readFileSync(full, 'utf8').split(/\r?\n/).length;
    } catch {
      continue;
    }

    if (lineCount > 500) {
      output.push(`${relative(directory, full)}: ${lineCount} lines`);
    }
  }

  return output.sort();
}

export function findCoverageGaps(
  directory: string,
  relFiles?: string[],
): string[] {
  const files = relFiles?.length
    ? relFiles
        .map((rel) => join(directory, rel))
        .filter((full) => existsSync(full))
    : listFilesRecursive(directory);

  const testKeys = new Set<string>();
  for (const full of files) {
    const rel = relative(directory, full);
    const lower = rel.toLowerCase();
    const ext = extname(full);
    if (!CODE_EXTS.has(ext)) {
      continue;
    }
    if (!TEST_HINTS.some((hint) => lower.includes(hint))) {
      continue;
    }

    const base = rel.slice(0, -ext.length).split('/').pop() ?? '';
    testKeys.add(base.replace(/\.(test|spec)$/i, ''));
  }

  const gaps: string[] = [];
  for (const full of files) {
    const rel = relative(directory, full);
    const lower = rel.toLowerCase();
    const ext = extname(full);
    if (!CODE_EXTS.has(ext)) {
      continue;
    }
    if (TEST_HINTS.some((hint) => lower.includes(hint))) {
      continue;
    }
    if (
      lower.startsWith('scripts/') ||
      lower.startsWith('bin/') ||
      lower.includes('/scripts/') ||
      lower.includes('/bin/')
    ) {
      continue;
    }

    const base = rel.slice(0, -ext.length).split('/').pop() ?? '';
    if (!testKeys.has(base)) {
      gaps.push(rel);
    }
  }

  return gaps.sort();
}

export function findDeadExports(
  directory: string,
  filesOrPath?: string[] | string,
): string[] {
  const files = toAbsoluteFileList(directory, filesOrPath).filter((full) =>
    JS_TS_EXTS.has(extname(full)),
  );

  const content = new Map<string, string>();
  for (const full of files) {
    try {
      content.set(full, readFileSync(full, 'utf8'));
    } catch {
      content.set(full, '');
    }
  }

  const hits: string[] = [];
  const exportRe =
    /export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g;

  for (const [full, text] of content.entries()) {
    const rel = relative(directory, full);
    let match: RegExpExecArray | null = null;

    // biome-ignore lint/suspicious/noAssignInExpressions: regex exec iterator
    while ((match = exportRe.exec(text))) {
      const name = match[1];
      if (!name) {
        continue;
      }

      const localUse =
        text.replace(match[0], '').match(new RegExp(`\\b${name}\\b`, 'g'))
          ?.length ?? 0;

      let importUse = 0;
      for (const [other, otherText] of content.entries()) {
        if (other === full) {
          continue;
        }
        if (new RegExp(`\\b${name}\\b`).test(otherText)) {
          importUse += 1;
        }
      }

      if (importUse === 0 && localUse <= 1) {
        hits.push(`${rel}: ${name}`);
      }
    }
  }

  return hits.sort();
}

export function classifyChangedFiles(relFiles: string[]): ChangedFileBuckets {
  const buckets: ChangedFileBuckets = {
    code: [],
    tests: [],
    docs: [],
    config: [],
  };

  for (const rel of relFiles) {
    const lower = rel.toLowerCase();
    if (TEST_HINTS.some((hint) => lower.includes(hint))) {
      buckets.tests.push(rel);
    } else if (lower.endsWith('.md') || lower.startsWith('docs/')) {
      buckets.docs.push(rel);
    } else if (
      lower.endsWith('.json') ||
      lower.endsWith('.yaml') ||
      lower.endsWith('.yml') ||
      lower.endsWith('.toml')
    ) {
      buckets.config.push(rel);
    } else {
      buckets.code.push(rel);
    }
  }

  return buckets;
}

export function recommendReviewTools(buckets: ChangedFileBuckets): string[] {
  const tools = ['review_diff'];

  if (buckets.code.length > 0) {
    tools.push('review_summary', 'review_complexity');
  }

  if (buckets.tests.length === 0 && buckets.code.length > 0) {
    tools.push('review_coverage_gaps');
  }

  if (buckets.docs.length > 0) {
    tools.push('review_todos');
  }

  return [...new Set(tools)];
}
