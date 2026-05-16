import { describe, expect, test } from 'bun:test';
import { createBoardRuntime } from './board-runtime';

describe('createBoardRuntime', () => {
  test('records routing decisions in memory', () => {
    const runtime = createBoardRuntime({
      enabled: true,
      defaultMode: 'route',
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
    });

    const record = runtime.route('Design API boundary');

    expect(record.action.type).toBe('delegate');
    expect(runtime.getRecentDecisions()).toHaveLength(1);
  });
});
