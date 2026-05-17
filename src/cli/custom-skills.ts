import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfigDir } from './paths';

const EXCLUDED_CUSTOM_SKILL_NAMES = new Set(['agent-browser']);

/**
 * A custom skill bundled in this repository.
 * Unlike npx-installed skills, these are copied from src/skills/ to the OpenCode skills directory
 */
export interface CustomSkill {
  /** Skill name (folder name) */
  name: string;
  /** Human-readable description */
  description: string;
  /** List of agents that should auto-allow this skill */
  allowedAgents: string[];
  /** Source path in this repo (relative to project root) */
  sourcePath: string;
}

const DEFAULT_ALLOWED_AGENTS_BY_SKILL: Record<string, string[]> = {
  simplify: ['oracle'],
  codemap: ['orchestrator'],
  clonedeps: ['orchestrator'],
};

const PREFERRED_DIRECT_SOURCE_PATH_BY_SKILL: Record<string, string> = {
  simplify: 'src/skills/simplify',
  codemap: 'src/skills/codemap',
  clonedeps: 'src/skills/clonedeps',
};

/**
 * Normalize path separators for manifest paths.
 */
function toPosixPath(pathValue: string): string {
  return pathValue.split(sep).join('/');
}

/**
 * Extract top-level frontmatter from SKILL.md.
 */
function extractFrontmatter(content: string): string | undefined {
  if (!content.startsWith('---\n')) {
    return undefined;
  }
  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return undefined;
  }
  return content.slice(4, endIndex);
}

/**
 * Parse a simple scalar frontmatter field.
 */
function parseSimpleFrontmatterField(
  frontmatter: string,
  fieldName: string,
): string | undefined {
  const lines = frontmatter.split('\n');
  const lineIndex = lines.findIndex((entry) =>
    entry.trimStart().startsWith(`${fieldName}:`),
  );
  const line = lineIndex >= 0 ? lines[lineIndex] : undefined;
  if (!line) {
    return undefined;
  }
  const value = line.slice(line.indexOf(':') + 1).trim();
  if (value.length === 0) {
    return undefined;
  }

  if (value === '>' || value === '|') {
    const blockLines: string[] = [];
    for (const next of lines.slice(lineIndex + 1)) {
      if (/^\S[^:]*:/.test(next)) {
        break;
      }
      if (next.trim().length === 0) {
        continue;
      }
      blockLines.push(next.trim());
    }
    return blockLines.join(value === '>' ? ' ' : '\n').trim() || undefined;
  }

  return value.replace(/^['"]|['"]$/g, '').trim();
}

/**
 * Discover SKILL.md files recursively under src/skills.
 */
function discoverSkillMarkdownFiles(skillsRoot: string): string[] {
  const results: string[] = [];

  function walk(directory: string): void {
    const entries = readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    );

    for (const entry of entries) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name === 'SKILL.md') {
        results.push(entryPath);
      }
    }
  }

  if (existsSync(skillsRoot)) {
    walk(skillsRoot);
  }

  return results.sort((a, b) => a.localeCompare(b));
}

export function resolvePackageRoot(packageRoot?: string): string {
  if (packageRoot) {
    return packageRoot;
  }

  let current = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    if (
      existsSync(join(current, 'package.json')) &&
      existsSync(join(current, 'src/skills'))
    ) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return fileURLToPath(new URL('../..', import.meta.url));
}

/**
 * Build bundled skills manifest from src/skills recursively.
 */
export function discoverCustomSkills(packageRoot?: string): CustomSkill[] {
  const resolvedPackageRoot = resolvePackageRoot(packageRoot);
  const skillsRoot = join(resolvedPackageRoot, 'src/skills');
  const skillFiles = discoverSkillMarkdownFiles(skillsRoot);
  const byName = new Map<string, CustomSkill>();

  for (const skillFile of skillFiles) {
    const sourceDir = dirname(skillFile);
    const sourcePath = toPosixPath(relative(resolvedPackageRoot, sourceDir));
    const folderName = sourceDir.split(sep).pop() ?? 'unknown-skill';

    const skillContent = readFileSync(skillFile, 'utf8');
    const frontmatter = extractFrontmatter(skillContent);
    const discoveredName =
      (frontmatter && parseSimpleFrontmatterField(frontmatter, 'name')) ||
      folderName;
    const name = discoveredName.replace(/^['"]|['"]$/g, '').trim();
    if (EXCLUDED_CUSTOM_SKILL_NAMES.has(name)) {
      continue;
    }
    const description =
      (frontmatter &&
        parseSimpleFrontmatterField(frontmatter, 'description')) ||
      `Bundled skill: ${name}`;

    const skill: CustomSkill = {
      name,
      description,
      allowedAgents: DEFAULT_ALLOWED_AGENTS_BY_SKILL[name] ?? [],
      sourcePath,
    };

    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, skill);
      continue;
    }

    const preferredPath = PREFERRED_DIRECT_SOURCE_PATH_BY_SKILL[name];
    if (preferredPath && existing.sourcePath !== preferredPath) {
      if (skill.sourcePath === preferredPath) {
        byName.set(name, skill);
      }
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Registry of custom skills bundled in this repository.
 */
export const CUSTOM_SKILLS: CustomSkill[] = discoverCustomSkills();

/**
 * Get the target directory for custom skills installation.
 */
export function getCustomSkillsDir(): string {
  return join(getConfigDir(), 'skills');
}

/**
 * Recursively copy a directory.
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    if (
      entry === '__pycache__' ||
      entry === '.DS_Store' ||
      entry.endsWith('.pyc') ||
      entry.endsWith('.pyo') ||
      entry.endsWith('.pyd')
    ) {
      continue;
    }

    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      const destDir = dirname(destPath);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Install a custom skill by copying from src/skills/ to the OpenCode skills directory
 * @param skill - The custom skill to install
 * @param projectRoot - Root directory of oh-my-opencode-slim project
 * @returns True if installation succeeded, false otherwise
 */
export function installCustomSkill(skill: CustomSkill): boolean {
  try {
    const packageRoot = fileURLToPath(new URL('../..', import.meta.url));
    const sourcePath = join(packageRoot, skill.sourcePath);
    const targetPath = join(getCustomSkillsDir(), skill.name);

    // Validate source exists
    if (!existsSync(sourcePath)) {
      console.error(`Custom skill source not found: ${sourcePath}`);
      return false;
    }

    // Copy skill directory
    copyDirRecursive(sourcePath, targetPath);

    return true;
  } catch (error) {
    console.error(`Failed to install custom skill: ${skill.name}`, error);
    return false;
  }
}
