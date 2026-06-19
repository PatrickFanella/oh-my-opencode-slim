import { describe, expect, test } from 'bun:test';
import { createRuntimeConfig } from './runtime-config';

describe('createRuntimeConfig', () => {
  test('returns normalized runtime artifacts from plugin config', () => {
    const result = createRuntimeConfig({
      agents: {
        oracle: { model: 'test/model' },
      },
      disabled_mcps: ['websearch'],
      enabled_mcps: ['playwright'],
      tmux: {
        enabled: true,
        layout: 'tiled',
        main_pane_size: 70,
      },
    });

    expect(result.config.agents?.oracle?.model).toBe('test/model');
    expect(result.agentConfigs?.oracle?.model).toBe('test/model');
    expect(result.mcpPolicy).toEqual({
      disabled: ['websearch'],
      enabled: ['playwright'],
    });
    expect(result.multiplexer).toEqual({
      type: 'tmux',
      layout: 'tiled',
      main_pane_size: 70,
    });
    expect(result.config.multiplexer).toEqual(result.multiplexer);
  });

  test('prefers explicit multiplexer config over legacy tmux config', () => {
    const result = createRuntimeConfig({
      multiplexer: {
        type: 'zellij',
        layout: 'even-horizontal',
        main_pane_size: 40,
      },
      tmux: {
        enabled: true,
        layout: 'tiled',
        main_pane_size: 70,
      },
    });

    expect(result.multiplexer).toEqual({
      type: 'zellij',
      layout: 'even-horizontal',
      main_pane_size: 40,
    });
    expect(result.config.multiplexer).toEqual(result.multiplexer);
  });

  test('maps disabled legacy tmux config to no multiplexer', () => {
    const result = createRuntimeConfig({
      tmux: {
        enabled: false,
        layout: 'main-vertical',
        main_pane_size: 60,
      },
    });

    expect(result.multiplexer).toEqual({
      type: 'none',
      layout: 'main-vertical',
      main_pane_size: 60,
    });
    expect(result.config.multiplexer).toEqual(result.multiplexer);
  });

  test('falls back to default multiplexer config when absent', () => {
    const result = createRuntimeConfig({});

    expect(result.multiplexer).toEqual({
      type: 'tmux',
      layout: 'main-vertical',
      main_pane_size: 60,
    });
    expect(result.config.multiplexer).toEqual(result.multiplexer);
    expect(result.mcpPolicy).toEqual({
      disabled: [],
      enabled: [],
    });
  });
});
