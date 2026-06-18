import { describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BACKGROUND_SUBAGENTS_ENV,
  installBackgroundSubagentsEnv,
} from './background-subagents';

function withTempHome(fn: (homeDir: string) => void): void {
  const homeDir = mkdtempSync(join(tmpdir(), 'blacktower-bg-subagents-'));
  try {
    fn(homeDir);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
}

describe('background subagents installer', () => {
  test('writes shell startup files once', () => {
    withTempHome((homeDir) => {
      const first = installBackgroundSubagentsEnv({ homeDir });
      const second = installBackgroundSubagentsEnv({ homeDir });

      expect(first.changed).toHaveLength(3);
      expect(first.alreadyConfigured).toHaveLength(0);
      expect(second.changed).toHaveLength(0);
      expect(second.alreadyConfigured).toHaveLength(3);

      expect(readFileSync(join(homeDir, '.bashrc'), 'utf8')).toContain(
        `export ${BACKGROUND_SUBAGENTS_ENV}=true`,
      );
      expect(
        readFileSync(join(homeDir, '.config', 'fish', 'config.fish'), 'utf8'),
      ).toContain(`set -gx ${BACKGROUND_SUBAGENTS_ENV} true`);
    });
  });

  test('preserves existing file content', () => {
    withTempHome((homeDir) => {
      const bashrc = join(homeDir, '.bashrc');
      writeFileSync(bashrc, 'alias oc=opencode');

      installBackgroundSubagentsEnv({ homeDir });

      expect(readFileSync(bashrc, 'utf8')).toBe(
        `alias oc=opencode\nexport ${BACKGROUND_SUBAGENTS_ENV}=true\n`,
      );
    });
  });

  test('dry run reports changes without writing files', () => {
    withTempHome((homeDir) => {
      const result = installBackgroundSubagentsEnv({ homeDir, dryRun: true });

      expect(result.changed).toHaveLength(3);
      expect(existsSync(join(homeDir, '.bashrc'))).toBe(false);
      expect(existsSync(join(homeDir, '.zshrc'))).toBe(false);
      expect(existsSync(join(homeDir, '.config', 'fish', 'config.fish'))).toBe(
        false,
      );
    });
  });
});
