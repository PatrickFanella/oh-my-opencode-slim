/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { generateLiteConfig, MODEL_MAPPINGS } from './providers';

describe('providers', () => {
  test('MODEL_MAPPINGS includes supported providers', () => {
    const keys = Object.keys(MODEL_MAPPINGS);
    expect(keys.sort()).toEqual([
      'copilot',
      'kimi',
      'openai',
      'opencode-go',
      'zai-plan',
    ]);
  });

  test('generateLiteConfig defaults to openai and includes only the active preset', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      reset: false,
    });

    expect(config.$schema).toBe(
      'https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json',
    );
    expect(config.preset).toBe('openai');
    expect(config.disabled_agents).toBeUndefined();
    expect((config.presets as any)['opencode-go']).toBeUndefined();
    const agents = (config.presets as any).openai;
    expect(agents).toBeDefined();
    expect(agents.orchestrator.model).toBe('openai/gpt-5.5');
    expect(agents.orchestrator.variant).toBeUndefined();
    expect(agents.council.model).toBe('openai/gpt-5.5');
    expect(agents.council.variant).toBe('high');
    expect(agents.fixer.model).toBe('openai/gpt-5.4-mini');
    expect(agents.fixer.variant).toBe('low');
    expect(agents.observer.model).toBe('openai/gpt-5.4-mini');
  });

  test('generateLiteConfig writes schema-only config for default install', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: true,
      reset: false,
    });

    expect(config).toEqual({
      $schema:
        'https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json',
    });
  });

  test('generateLiteConfig uses correct OpenAI models', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      reset: false,
    });

    const agents = (config.presets as any).openai;
    expect(agents.orchestrator.model).toBe(
      MODEL_MAPPINGS.openai.orchestrator.model,
    );
    expect(agents.oracle.model).toBe('openai/gpt-5.5');
    expect(agents.oracle.variant).toBe('high');
    expect(agents.council.model).toBe('openai/gpt-5.5');
    expect(agents.council.variant).toBe('high');
    expect(agents.librarian.model).toBe('openai/gpt-5.4-mini');
    expect(agents.librarian.variant).toBe('low');
    expect(agents.explorer.model).toBe('openai/gpt-5.4-mini');
    expect(agents.explorer.variant).toBe('low');
    expect(agents.designer.model).toBe('openai/gpt-5.4-mini');
    expect(agents.designer.variant).toBe('medium');
  });

  test('generateLiteConfig can set opencode-go as active preset', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      preset: 'opencode-go',
      reset: false,
    });

    expect(config.preset).toBe('opencode-go');
    expect(config.disabled_agents).toEqual([]);
    expect((config.presets as any).openai).toBeUndefined();
    const agents = (config.presets as any)['opencode-go'];
    expect(agents).toBeDefined();
    expect(agents.orchestrator.model).toBe('opencode-go/glm-5.1');
    expect(agents.oracle.model).toBe('opencode-go/deepseek-v4-pro');
    expect(agents.oracle.variant).toBe('max');
    expect(agents.council.model).toBe('opencode-go/deepseek-v4-pro');
    expect(agents.council.variant).toBe('high');
    expect(agents.librarian.model).toBe('opencode-go/minimax-m2.7');
    expect(agents.explorer.model).toBe('opencode-go/minimax-m2.7');
    expect(agents.designer.model).toBe('opencode-go/kimi-k2.6');
    expect(agents.fixer.model).toBe('opencode-go/deepseek-v4-flash');
    expect(agents.fixer.variant).toBe('high');
    expect(agents.observer.model).toBe('opencode-go/kimi-k2.6');
  });

  test('generateLiteConfig rejects unsupported preset', () => {
    expect(() =>
      generateLiteConfig({
        hasTmux: false,
        installSkills: false,
        preset: 'not-real',
        reset: false,
      }),
    ).toThrow('Unsupported preset "not-real"');
  });

  test('generateLiteConfig rejects non-generated model mappings as active presets', () => {
    expect(() =>
      generateLiteConfig({
        hasTmux: false,
        installSkills: false,
        preset: 'kimi',
        reset: false,
      }),
    ).toThrow('Unsupported preset "kimi"');
  });

  test('generateLiteConfig rejects inherited property names as presets', () => {
    expect(() =>
      generateLiteConfig({
        hasTmux: false,
        installSkills: false,
        preset: 'toString',
        reset: false,
      }),
    ).toThrow('Unsupported preset "toString"');
  });

  test('generateLiteConfig omits multiplexer because plugin owns defaults', () => {
    const config = generateLiteConfig({
      hasTmux: true,
      installSkills: false,
      reset: false,
    });

    expect(config.tmux).toBeUndefined();
    expect(config.multiplexer).toBeUndefined();
  });

  test('generateLiteConfig omits skillProfiles when code-managed skills are enabled', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: true,
      preset: 'openai',
      reset: false,
    });

    const agents = (config.presets as any).openai;
    expect(agents.orchestrator.skills).toBeUndefined();
    expect(agents.oracle.skills).toBeUndefined();
    expect(agents.designer.skills).toBeUndefined();

    expect(config.skillProfiles).toBeUndefined();
  });

  test('generateLiteConfig disables skill profiles when skills are disabled', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      reset: false,
    });

    const profiles = config.skillProfiles as any;
    expect(profiles.global).toEqual([]);
    expect(profiles.agents.orchestrator).toEqual([]);
    expect(profiles.agents.oracle).toEqual([]);
    expect(profiles.agents.designer).toEqual([]);
    expect(profiles.agents.fixer).toEqual([]);
  });

  test('generateLiteConfig includes mcps field', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      reset: false,
    });

    const agents = (config.presets as any).openai;
    expect(agents.orchestrator.mcps).toBeDefined();
    expect(Array.isArray(agents.orchestrator.mcps)).toBe(true);
    expect(agents.librarian.mcps).toBeDefined();
    expect(Array.isArray(agents.librarian.mcps)).toBe(true);
  });

  test('generateLiteConfig openai includes correct mcps', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      reset: false,
    });

    const agents = (config.presets as any).openai;
    expect(agents.orchestrator.mcps).toEqual(['websearch', 'grep_app']);
    expect(agents.librarian.mcps).toContain('websearch');
    expect(agents.librarian.mcps).toContain('context7');
    expect(agents.librarian.mcps).toContain('grep_app');
    expect(agents.designer.mcps).toEqual([]);
  });
});
