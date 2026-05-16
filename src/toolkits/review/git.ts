import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runShell, type ShellRunner, shellEscape } from '../github/helpers';

export async function getChangedFiles(
  $: ShellRunner,
  directory: string,
  base?: string,
): Promise<string[]> {
  const command = base
    ? `git diff --name-only ${shellEscape(base)}...HEAD`
    : "git diff --name-only && printf '\n' && git diff --cached --name-only";

  const output = await runShell($, command);
  const seen = new Set<string>();

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      if (seen.has(line)) {
        return false;
      }
      seen.add(line);
      return existsSync(join(directory, line));
    });
}
