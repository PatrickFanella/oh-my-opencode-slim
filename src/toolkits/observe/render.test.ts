import { describe, expect, test } from 'bun:test';
import type { ObserveEventRow, ObserveLoopRow } from './db';
import {
  formatHistory,
  formatLoop,
  formatPrune,
  renderObservationResumeNote,
  renderObservationStateBlock,
} from './render';

function loopFixture(): ObserveLoopRow {
  return {
    id: 'obs-1',
    session_id: 'session-1',
    target: 'service-a',
    interval_secs: 30,
    max_cycles: 5,
    success_criteria: 'healthy',
    active: 1,
    cycle_count: 1,
    pending: 0,
    last_result: 'degraded',
    last_summary: 'slow',
    last_trigger: 'session.idle',
    started_at: '2026-05-16T00:00:00.000Z',
    last_checked_at: '2026-05-16T00:01:00.000Z',
    next_check_at: '2026-05-16T00:02:00.000Z',
    completed_at: null,
    lock_expires_at: null,
    created_at: '2026-05-16T00:00:00.000Z',
    updated_at: '2026-05-16T00:01:00.000Z',
  };
}

describe('observe render', () => {
  test('formats loop and history output', () => {
    const loop = loopFixture();
    const event: ObserveEventRow = {
      id: 1,
      loop_id: loop.id,
      at: '2026-05-16T00:01:00.000Z',
      type: 'cycle',
      session_id: 'session-1',
      result: 'degraded',
      summary: 'slow',
      details: null,
    };

    expect(formatLoop(loop)).toContain('obs-1: service-a');
    expect(formatHistory([event])).toContain('loop=obs-1 cycle degraded slow');
    expect(formatHistory([])).toBe('No observe history found.');
  });

  test('formats prune and observation state blocks', () => {
    const loop = loopFixture();
    const prune = formatPrune({
      loopsRemoved: 1,
      eventsRemoved: 2,
      remainingLoops: 3,
      remainingEvents: 4,
    });

    const state = renderObservationStateBlock('/tmp/observe.db', [loop]);
    const resume = renderObservationResumeNote([loop]);

    expect(prune).toBe('Removed loops=1 events=2. Remaining loops=3 events=4.');
    expect(state).toContain('<observation-state>');
    expect(state).toContain('db_path=/tmp/observe.db');
    expect(resume).toContain('<observation-resume>');
    expect(resume).toContain('Loop obs-1: target=service-a');
  });
});
