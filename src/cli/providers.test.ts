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

  test('generateLiteConfig defaults to openai and includes generated presets', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
      reset: false,
    });

    expect(config.$schema).toBe(
      'https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json',
    );
    expect(config.preset).toBe('openai');
    expect(config.disabled_agents).toBeUndefined();
    expect((config.presets as any)['opencode-go']).toBeDefined();
    expect((config.presets as any)['opencode-go'].observer.model).toBe(
      'opencode-go/kimi-k2.6',
    );
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

  test('generateLiteConfig uses correct OpenAI models', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
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
      installCustomSkills: false,
      preset: 'opencode-go',
      reset: false,
    });

    expect(config.preset).toBe('opencode-go');
    expect(config.disabled_agents).toEqual([]);
    expect((config.presets as any).openai).toBeDefined();
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
        installCustomSkills: false,
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
        installCustomSkills: false,
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
        installCustomSkills: false,
        preset: 'toString',
        reset: false,
      }),
    ).toThrow('Unsupported preset "toString"');
  });

  test('generateLiteConfig enables tmux when requested', () => {
    const config = generateLiteConfig({
      hasTmux: true,
      installSkills: false,
      installCustomSkills: false,
      reset: false,
    });

    expect(config.tmux).toBeDefined();
    expect((config.tmux as any).enabled).toBe(true);
    expect((config.tmux as any).layout).toBe('main-vertical');
  });

  test('generateLiteConfig includes default skill profiles', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: true,
      installCustomSkills: false,
      reset: false,
    });

    const agents = (config.presets as any).openai;
    expect(agents.orchestrator.skills).toBeUndefined();
    expect(agents.oracle.skills).toBeUndefined();
    expect(agents.designer.skills).toBeUndefined();

    const profiles = config.skillProfiles as any;
    expect(profiles.global).toContain('summarization');
    expect(profiles.global).toContain('systematic-debugging');
    expect(profiles.global).toContain('github-pro');
    expect(profiles.global).toContain('review-quality');
    expect(profiles.global).toContain('session-handoff');
    expect(profiles.agents.orchestrator).toContain('codemap');
    expect(profiles.agents.orchestrator).toContain('clonedeps');
    expect(profiles.agents.oracle).toContain('requesting-code-review');
    expect(profiles.agents.oracle).toContain('security-threat-model');
    expect(profiles.agents.designer).toContain('agent-browser');
    expect(profiles.agents.designer).toContain('wcag-audit-patterns');
    expect(profiles.agents.fixer).toContain('tdd');
    expect(profiles.agents.fixer).toContain('typescript-pro');
    expect(profiles.agents.fixer).toContain('golang-pro');
    expect(profiles.agents.fixer).toContain('python-tooling-patterns');
    expect(profiles.agents.fixer).not.toContain('*');
  });

  test('generateLiteConfig includes mcps field', () => {
    const config = generateLiteConfig({
      hasTmux: false,
      installSkills: false,
      installCustomSkills: false,
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
      installCustomSkills: false,
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
