import { describe, expect, test } from 'bun:test';
import { decideBoardAction } from './board-policy';

describe('decideBoardAction', () => {
  test('uses self when board has no candidate', () => {
    expect(
      decideBoardAction({
        input: 'hello',
        mode: 'route',
        councilEscalation: true,
        candidates: [],
      }),
    ).toEqual({
      type: 'self',
      reason: 'No board role matched the request.',
    });
  });

  test('delegates when primary candidate exists', () => {
    const action = decideBoardAction({
      input: 'auth API',
      mode: 'route',
      councilEscalation: true,
      primary: {
        id: 'security',
        title: 'Security Advisor',
        purpose: 'Security',
        when: ['auth'],
        outputs: ['risks'],
        agent: 'security-advisor',
        priority: 90,
      },
      candidates: [],
    });

    expect(action).toEqual({
      type: 'delegate',
      agent: 'security-advisor',
      reason: 'Board selected Security Advisor.',
    });
  });

  test('uses council for decide mode with multiple candidates', () => {
    const action = decideBoardAction({
      input: 'auth API',
      mode: 'decide',
      councilEscalation: true,
      primary: {
        id: 'security',
        title: 'Security Advisor',
        purpose: 'Security',
        when: ['auth'],
        outputs: ['risks'],
        agent: 'security-advisor',
        priority: 90,
      },
      candidates: [
        {
          id: 'security',
          title: 'Security Advisor',
          purpose: 'Security',
          when: ['auth'],
          outputs: ['risks'],
          agent: 'security-advisor',
          priority: 90,
        },
        {
          id: 'backend',
          title: 'Backend Architect',
          purpose: 'API design',
          when: ['API'],
          outputs: ['recommendation'],
          agent: 'backend-architect',
          priority: 70,
        },
      ],
    });

    expect(action).toEqual({
      type: 'council',
      reason: 'Board selected council escalation for multi-role decision.',
    });
  });
});
