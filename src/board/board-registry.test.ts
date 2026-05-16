import { describe, expect, test } from 'bun:test';
import { createBoardRegistry } from './board-registry';

describe('createBoardRegistry', () => {
  test('returns disabled registry when board config is absent', () => {
    const registry = createBoardRegistry(undefined);

    expect(registry.enabled).toBe(false);
    expect(registry.roles).toEqual([]);
  });

  test('sorts enabled roles by priority descending', () => {
    const registry = createBoardRegistry({
      enabled: true,
      defaultMode: 'route',
      councilEscalation: true,
      roles: {
        lower: {
          title: 'Lower',
          purpose: 'Lower priority role',
          when: ['low risk'],
          outputs: ['note'],
          agent: 'lower',
          priority: 10,
        },
        higher: {
          title: 'Higher',
          purpose: 'Higher priority role',
          when: ['high risk'],
          outputs: ['decision'],
          agent: 'higher',
          priority: 90,
        },
      },
    });

    expect(registry.enabled).toBe(true);
    expect(registry.roles.map((role) => role.id)).toEqual(['higher', 'lower']);
  });
});
