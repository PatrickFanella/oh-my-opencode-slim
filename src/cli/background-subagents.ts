import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export type BackgroundSubagentsMode = 'ask' | 'yes' | 'no';

export interface BackgroundSubagentsInstallResult {
  changed: string[];
  alreadyConfigured: string[];
  skipped: string[];
}

interface ShellStartupFile {
  path: string;
  line: string;
}

export const BACKGROUND_SUBAGENTS_ENV =
  'OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS';

function shellStartupFiles(homeDir = homedir()): ShellStartupFile[] {
  return [
    {
      path: join(homeDir, '.bashrc'),
      line: `export ${BACKGROUND_SUBAGENTS_ENV}=true`,
    },
    {
      path: join(homeDir, '.zshrc'),
      line: `export ${BACKGROUND_SUBAGENTS_ENV}=true`,
    },
    {
      path: join(homeDir, '.config', 'fish', 'config.fish'),
      line: `set -gx ${BACKGROUND_SUBAGENTS_ENV} true`,
    },
  ];
}

function fileContainsEnv(content: string): boolean {
  return content.includes(BACKGROUND_SUBAGENTS_ENV);
}

function appendLine(content: string, line: string): string {
  const prefix = content && !content.endsWith('\n') ? '\n' : '';
  return `${content}${prefix}${line}\n`;
}

export function installBackgroundSubagentsEnv(
  options: { homeDir?: string; dryRun?: boolean } = {},
): BackgroundSubagentsInstallResult {
  const result: BackgroundSubagentsInstallResult = {
    changed: [],
    alreadyConfigured: [],
    skipped: [],
  };

  for (const file of shellStartupFiles(options.homeDir)) {
    const exists = existsSync(file.path);
    const content = exists ? readFileSync(file.path, 'utf8') : '';
    if (fileContainsEnv(content)) {
      result.alreadyConfigured.push(file.path);
      continue;
    }

    result.changed.push(file.path);
    if (options.dryRun) continue;

    mkdirSync(dirname(file.path), { recursive: true });
    writeFileSync(file.path, appendLine(content, file.line));
  }

  return result;
}
