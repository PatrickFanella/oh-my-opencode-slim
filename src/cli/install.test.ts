import { describe, expect, test } from 'bun:test';
import { createInstallConfig } from './install';

describe('install config', () => {
  test('records detected tmux availability', () => {
    const config = createInstallConfig(
      { tui: false, skills: 'yes', reset: true },
      true,
    );

    expect(config.hasTmux).toBe(true);
    expect(config.installSkills).toBe(true);
    expect(config.reset).toBe(true);
  });

  test('records tmux as unavailable when not detected', () => {
    const config = createInstallConfig(
      { tui: false, skills: 'no', reset: false },
      false,
    );

    expect(config.hasTmux).toBe(false);
    expect(config.installSkills).toBe(false);
  });
});
