import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { CUSTOM_SKILLS, resolvePackageRoot } from '../cli/custom-skills';
import { getConfigDir } from '../cli/paths';
import { type PluginConfig, resolveAgentSkills } from '../config';

export interface MaterializeCuratedSkillsResult {
  targetDir: string;
  copied: string[];
  missing: string[];
}

export function getManagedSkillsDir(configDir = getConfigDir()): string {
  return join(configDir, 'blacktower', 'managed-skills');
}

export function getCuratedSkillNamesForAgents(
  config: PluginConfig | undefined,
  agentNames: readonly string[],
): string[] {
  const names = new Set<string>();

  for (const agentName of agentNames) {
    for (const skillName of resolveAgentSkills(config, agentName)) {
      if (skillName === '*' || skillName === '!*' || skillName.startsWith('!')) {
        continue;
      }
      names.add(skillName);
    }
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function getBundledSkillSources(packageRoot = resolvePackageRoot()): Map<
  string,
  string
> {
  return new Map(
    CUSTOM_SKILLS.map((skill) => [
      skill.name,
      join(packageRoot, skill.sourcePath),
    ]),
  );
}

export function materializeCuratedSkills(
  config: PluginConfig | undefined,
  agentNames: readonly string[],
  options: { targetDir?: string; packageRoot?: string } = {},
): MaterializeCuratedSkillsResult {
  const targetDir = options.targetDir ?? getManagedSkillsDir();
  const selectedNames = getCuratedSkillNamesForAgents(config, agentNames);
  const selected = new Set(selectedNames);
  const sources = getBundledSkillSources(options.packageRoot);
  const copied: string[] = [];
  const missing: string[] = [];

  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(targetDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || selected.has(entry.name)) continue;
    rmSync(join(targetDir, entry.name), { recursive: true, force: true });
  }

  for (const skillName of selectedNames) {
    const sourcePath = sources.get(skillName);
    if (!sourcePath || !existsSync(sourcePath) || !statSync(sourcePath).isDirectory()) {
      missing.push(skillName);
      continue;
    }

    const targetPath = join(targetDir, skillName);
    rmSync(targetPath, { recursive: true, force: true });
    cpSync(sourcePath, targetPath, { recursive: true });
    copied.push(skillName);
  }

  return { targetDir, copied, missing };
}
