import { describe, expect, test } from 'bun:test';
import { createBoardRegistry } from './board-registry';
import { routeBoardRequest } from './board-router';

const registry = createBoardRegistry({
  enabled: true,
  defaultMode: 'route',
  councilEscalation: true,
  roles: {
    backend: {
      title: 'Backend Architect',
      purpose: 'API design',
      when: ['API', 'auth', 'service'],
      outputs: ['recommendation'],
      agent: 'backend-architect',
      priority: 70,
    },
    security: {
      title: 'Security Advisor',
      purpose: 'Security review',
      when: ['auth', 'secrets', 'privacy'],
      outputs: ['risks'],
      agent: 'security-advisor',
      priority: 90,
    },
  },
});

describe('routeBoardRequest', () => {
  test('returns matching roles ordered by score and priority', () => {
    const decision = routeBoardRequest(
      registry,
      'Review auth boundary for API',
    );

    expect(decision.primary?.agent).toBe('security-advisor');
    expect(decision.candidates.map((role) => role.agent)).toContain(
      'backend-architect',
    );
  });

  test('returns empty candidates for disabled registry', () => {
    const decision = routeBoardRequest(createBoardRegistry(undefined), 'API');

    expect(decision.primary).toBeUndefined();
    expect(decision.candidates).toEqual([]);
  });

  test('does not route when board mode is off', () => {
    const decision = routeBoardRequest(
      createBoardRegistry({
        enabled: true,
        defaultMode: 'off',
        councilEscalation: true,
        roles: {
          backend: {
            title: 'Backend Architect',
            purpose: 'API design',
            when: ['API'],
            outputs: ['recommendation'],
            agent: 'backend-architect',
            priority: 70,
          },
        },
      }),
      'API',
    );

    expect(decision.mode).toBe('off');
    expect(decision.primary).toBeUndefined();
  });
});
