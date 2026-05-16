import { describe, expect, test } from 'bun:test';
import { registerCommandTemplates } from './command-registry';

describe('registerCommandTemplates', () => {
  test('creates command map and registers missing commands', () => {
    const config: Record<string, unknown> = {};

    registerCommandTemplates(config, {
      'plugin-status': {
        description: 'Show local plugin fleet status',
        template: 'Use the plugin_status tool.',
      },
    });

    expect(config.command).toEqual({
      'plugin-status': {
        description: 'Show local plugin fleet status',
        template: 'Use the plugin_status tool.',
      },
    });
  });

  test('preserves user-provided commands', () => {
    const config: Record<string, unknown> = {
      command: {
        'plugin-status': {
          description: 'custom',
          template: 'custom template',
        },
      },
    };

    registerCommandTemplates(config, {
      'plugin-status': {
        description: 'Show local plugin fleet status',
        template: 'Use the plugin_status tool.',
      },
    });

    expect(config.command).toEqual({
      'plugin-status': {
        description: 'custom',
        template: 'custom template',
      },
    });
  });
});
