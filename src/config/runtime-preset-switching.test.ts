import { afterEach, describe, expect, test } from 'bun:test';
import { DEFAULT_MODELS } from './constants';
import {
  getActiveRuntimePreset,
  getPreviousRuntimePreset,
  rollbackRuntimePreset,
  setActiveRuntimePreset,
  setActiveRuntimePresetWithPrevious,
} from './runtime-preset';
import { setRuntimePresetBaselineAgents } from './runtime-preset-baseline';
import {
  applyRuntimePresetConfigHook,
  buildRuntimePresetSwitchPlan,
  createRuntimePresetEffectiveConfig,
  syncRuntimePresetFromConfig,
} from './runtime-preset-switching';
import type { PluginConfig } from './schema';

describe('runtime-preset-switching', () => {
  afterEach(() => {
    rollbackRuntimePreset(null);
  });

  test('builds switch plan with alias resolution and baseline reset', () => {
    setActiveRuntimePreset('cheap');
    const config: PluginConfig = {
      agents: {
        orchestrator: { model: 'openai/gpt-5.4-mini', temperature: 0.2 },
      },
      presets: {
        cheap: { explore: { model: 'anthropic/claude-3.5-haiku' } },
        powerful: { orchestrator: { model: 'openai/gpt-5.5' } },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'powerful');

    expect('error' in plan).toBeFalse();
    if ('error' in plan) return;
    expect(plan.previousPreset).toBe('cheap');
    expect(plan.updates).toEqual({
      explorer: { model: DEFAULT_MODELS.explorer },
      orchestrator: { model: 'openai/gpt-5.5' },
    });
  });

  test('clears stale active preset when config no longer defines it', () => {
    setActiveRuntimePreset('deleted');
    const config: PluginConfig = {
      preset: 'current',
      presets: {
        current: { orchestrator: { model: 'current/model' } },
      },
    };

    syncRuntimePresetFromConfig(config);

    expect(getActiveRuntimePreset()).toBeNull();
  });

  test('creates effective config without contaminating baseline agents', () => {
    setActiveRuntimePreset('runtime');
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'baseline/model', temperature: 0.2 },
      },
      presets: {
        runtime: {
          explorer: { model: 'runtime/model', variant: 'runtime' },
        },
      },
    };

    const effective = createRuntimePresetEffectiveConfig(config);

    expect(effective).not.toBe(config);
    expect(effective.preset).toBe('runtime');
    expect(effective.agents?.explorer).toEqual({
      model: 'runtime/model',
      temperature: 0.2,
      variant: 'runtime',
    });
    expect(config.agents?.explorer).toEqual({
      model: 'baseline/model',
      temperature: 0.2,
    });
  });

  test('effective runtime config resolves preset aliases before merging', () => {
    setActiveRuntimePreset('runtime');
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'baseline/model', temperature: 0.2 },
      },
      presets: {
        runtime: {
          explore: { model: 'runtime/model' },
        },
      },
    };

    const effective = createRuntimePresetEffectiveConfig(config);

    expect(effective.agents?.explorer).toEqual({
      model: 'runtime/model',
      temperature: 0.2,
    });
    expect(effective.agents?.explore).toBeUndefined();
  });

  test('does not reapply already-loaded config preset over root overrides', () => {
    setActiveRuntimePreset('cheap');
    const config: PluginConfig = {
      preset: 'cheap',
      agents: {
        explorer: { model: 'root/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model' },
        },
      },
    };
    setRuntimePresetBaselineAgents(config, {
      explorer: { model: 'root/model' },
    });

    const effective = createRuntimePresetEffectiveConfig(config);

    expect(effective).toBe(config);
    expect(effective.agents?.explorer?.model).toBe('root/model');
  });

  test('config hook respects root override for active config preset', () => {
    setActiveRuntimePreset('cheap');
    const config: PluginConfig = {
      preset: 'cheap',
      agents: {
        explorer: { model: 'root/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model', temperature: 0.2 },
        },
      },
    };
    setRuntimePresetBaselineAgents(config, {
      explorer: { model: 'root/model' },
    });
    const configAgent: Record<string, Record<string, unknown>> = {
      explorer: { model: 'root/model' },
    };

    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.explorer).toEqual({
      model: 'root/model',
      temperature: 0.2,
    });
  });

  test('rejects plugin-scoped preset switches', () => {
    const config: PluginConfig = {
      presets: {
        a: { orchestrator: { model: 'openai/gpt-5.4-mini' } },
        b: { orchestrator: { model: 'openai/gpt-5.5', skills: ['codemap'] } },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'b');

    expect('error' in plan).toBeTrue();
    if (!('error' in plan)) return;
    expect(plan.error).toContain('skills');
  });

  test('normalizes aliases when validating plugin-scoped fields', () => {
    setActiveRuntimePreset('alias');
    const config: PluginConfig = {
      presets: {
        alias: {
          explore: { model: 'alias/model', mcps: ['context7'] },
        },
        canonical: {
          explorer: { model: 'canonical/model', mcps: ['context7'] },
        },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'canonical');

    expect('error' in plan).toBeFalse();
  });

  test('compares effective plugin-scoped fields against config baseline', () => {
    setActiveRuntimePreset('current');
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'baseline/model', skills: ['codemap'] },
      },
      presets: {
        current: {
          explorer: { model: 'current/model' },
        },
        next: {
          explorer: { model: 'next/model' },
        },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'next');

    expect('error' in plan).toBeFalse();
  });

  test('resets removed preset agents to plugin defaults without user baseline', () => {
    setActiveRuntimePreset('current');
    const config: PluginConfig = {
      presets: {
        current: {
          explorer: { model: 'current/model' },
        },
        next: {
          orchestrator: { model: 'next/model' },
        },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'next');

    expect('error' in plan).toBeFalse();
    if ('error' in plan) return;
    expect(plan.resetAgentNames).toEqual(['explorer']);
    expect(plan.updates.explorer).toEqual({ model: DEFAULT_MODELS.explorer });
  });

  test('uses loader baseline snapshot instead of config-file preset overlay', () => {
    setActiveRuntimePreset('cheap');
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'cheap/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model' },
        },
        powerful: {
          orchestrator: { model: 'powerful/model' },
        },
      },
    };
    setRuntimePresetBaselineAgents(config, undefined);

    const plan = buildRuntimePresetSwitchPlan(config, 'powerful');

    expect('error' in plan).toBeFalse();
    if ('error' in plan) return;
    expect(plan.updates.explorer).toEqual({ model: DEFAULT_MODELS.explorer });
  });

  test('partial baseline still resets removed preset model to plugin default', () => {
    setActiveRuntimePreset('current');
    const config: PluginConfig = {
      agents: {
        explorer: { skills: ['codemap'] },
      },
      presets: {
        current: {
          explorer: { model: 'current/model' },
        },
        next: {
          orchestrator: { model: 'next/model' },
        },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'next');

    expect('error' in plan).toBeFalse();
    if ('error' in plan) return;
    expect(plan.updates.explorer).toEqual({ model: DEFAULT_MODELS.explorer });
  });

  test('same-agent partial preset resets previous model in switch plan', () => {
    setActiveRuntimePreset('cheap');
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'baseline/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model' },
        },
        tuned: {
          explorer: { temperature: 0.2 },
        },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'tuned');

    expect('error' in plan).toBeFalse();
    if ('error' in plan) return;
    expect(plan.updates.explorer).toEqual({
      model: 'baseline/model',
      temperature: 0.2,
    });
  });

  test('same-agent partial reset honors aliased baseline keys', () => {
    setActiveRuntimePreset('cheap');
    const config: PluginConfig = {
      agents: {
        explore: { model: 'baseline/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model' },
        },
        tuned: {
          explorer: { temperature: 0.2 },
        },
      },
    };

    const plan = buildRuntimePresetSwitchPlan(config, 'tuned');

    expect('error' in plan).toBeFalse();
    if ('error' in plan) return;
    expect(plan.updates.explorer).toEqual({
      model: 'baseline/model',
      temperature: 0.2,
    });
  });

  test('applies runtime preset hook with stale scalar cleanup', () => {
    setActiveRuntimePreset('current');
    const config: PluginConfig = {
      agents: {
        orchestrator: { model: 'baseline/model', temperature: 0.2 },
        explorer: { model: 'baseline/explorer', variant: 'base' },
      },
      presets: {
        current: {
          orchestrator: {
            model: 'override/model',
            temperature: 0.9,
            variant: 'thinking',
            options: { depth: 2 },
          },
          explore: { model: 'explorer/model', variant: 'fast' },
        },
        next: {
          orchestrator: { model: 'next/model' },
        },
      },
    };
    const configAgent: Record<string, Record<string, unknown>> = {
      orchestrator: {
        model: 'stale/model',
        temperature: 0.9,
        variant: 'thinking',
        options: { depth: 2 },
      },
      explorer: {
        model: 'stale/explorer',
        variant: 'fast',
      },
    };

    syncRuntimePresetFromConfig(config);
    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.orchestrator).toEqual({
      model: 'override/model',
      temperature: 0.9,
      variant: 'thinking',
      options: { depth: 2 },
    });
    expect(configAgent.explorer).toEqual({
      model: 'explorer/model',
      variant: 'fast',
    });
    expect(getActiveRuntimePreset()).toBe('current');
    expect(getPreviousRuntimePreset()).toBeNull();
  });

  test('preserves inline array-model variant while clearing stale variant', () => {
    setActiveRuntimePreset('previous');
    setActiveRuntimePresetWithPrevious('current');
    const config: PluginConfig = {
      presets: {
        previous: {
          orchestrator: { model: 'previous/model', variant: 'stale' },
        },
        current: {
          orchestrator: {
            model: [{ id: 'current/model', variant: 'inline' }],
          },
        },
      },
    };
    const configAgent: Record<string, Record<string, unknown>> = {
      orchestrator: { model: 'previous/model', variant: 'stale' },
    };

    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.orchestrator).toEqual({
      model: 'current/model',
      variant: 'inline',
    });
  });

  test('clears stale inline array-model variant when next preset has none', () => {
    setActiveRuntimePreset('previous');
    setActiveRuntimePresetWithPrevious('current');
    const config: PluginConfig = {
      presets: {
        previous: {
          orchestrator: {
            model: [{ id: 'previous/model', variant: 'fast' }],
          },
        },
        current: {
          orchestrator: { model: 'current/model' },
        },
      },
    };
    const configAgent: Record<string, Record<string, unknown>> = {
      orchestrator: { model: 'previous/model', variant: 'fast' },
    };

    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.orchestrator).toEqual({ model: 'current/model' });
  });

  test('config hook resets removed preset agent model to plugin default', () => {
    setActiveRuntimePreset('next');
    setActiveRuntimePresetWithPrevious('current');
    const config: PluginConfig = {
      presets: {
        current: {
          orchestrator: { model: 'current/model' },
        },
        next: {
          explorer: { model: 'next/model' },
        },
      },
    };
    const configAgent: Record<string, Record<string, unknown>> = {
      orchestrator: { model: 'current/model' },
      explorer: { model: 'next/model' },
    };

    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.explorer).toEqual({ model: DEFAULT_MODELS.explorer });
  });

  test('config hook resets same-agent model when next preset omits model', () => {
    setActiveRuntimePreset('cheap');
    setActiveRuntimePresetWithPrevious('tuned');
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'baseline/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model' },
        },
        tuned: {
          explorer: { temperature: 0.2 },
        },
      },
    };
    const configAgent: Record<string, Record<string, unknown>> = {
      explorer: { model: 'cheap/model' },
    };

    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.explorer).toEqual({
      model: 'baseline/model',
      temperature: 0.2,
    });
  });

  test('config hook same-agent reset honors aliased baseline keys', () => {
    setActiveRuntimePreset('cheap');
    setActiveRuntimePresetWithPrevious('tuned');
    const config: PluginConfig = {
      agents: {
        explore: { model: 'baseline/model' },
      },
      presets: {
        cheap: {
          explorer: { model: 'cheap/model' },
        },
        tuned: {
          explorer: { temperature: 0.2 },
        },
      },
    };
    const configAgent: Record<string, Record<string, unknown>> = {
      explorer: { model: 'cheap/model' },
    };

    applyRuntimePresetConfigHook(config, configAgent);

    expect(configAgent.explorer).toEqual({
      model: 'baseline/model',
      temperature: 0.2,
    });
  });
});
