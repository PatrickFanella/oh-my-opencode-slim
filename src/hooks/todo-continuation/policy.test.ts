import { describe, expect, test } from 'bun:test';
import { decideTodoContinuation } from './continuation-policy';

describe('decideTodoContinuation', () => {
  test('continues when incomplete todos remain and cooldown allows it', () => {
    expect(
      decideTodoContinuation({
        incompleteTodoCount: 2,
        isOrchestrator: true,
        cooldownActive: false,
        maxContinuationsReached: false,
        explicitStopRequested: false,
        pendingTimerActive: false,
        injectionInFlight: false,
      }),
    ).toEqual({ action: 'continue' });
  });

  test('suppresses during cooldown', () => {
    expect(
      decideTodoContinuation({
        incompleteTodoCount: 2,
        isOrchestrator: true,
        cooldownActive: true,
        maxContinuationsReached: false,
        explicitStopRequested: false,
        pendingTimerActive: false,
        injectionInFlight: false,
      }),
    ).toEqual({ action: 'suppress', reason: 'cooldown' });
  });

  test('suppresses after explicit stop', () => {
    expect(
      decideTodoContinuation({
        incompleteTodoCount: 2,
        isOrchestrator: true,
        cooldownActive: false,
        maxContinuationsReached: false,
        explicitStopRequested: true,
        pendingTimerActive: false,
        injectionInFlight: false,
      }),
    ).toEqual({ action: 'suppress', reason: 'explicit_stop' });
  });

  test('ignores non-orchestrator sessions', () => {
    expect(
      decideTodoContinuation({
        incompleteTodoCount: 2,
        isOrchestrator: false,
        cooldownActive: false,
        maxContinuationsReached: false,
        explicitStopRequested: false,
        pendingTimerActive: false,
        injectionInFlight: false,
      }),
    ).toEqual({ action: 'noop', reason: 'not_orchestrator' });
  });

  test('stops at max continuations', () => {
    expect(
      decideTodoContinuation({
        incompleteTodoCount: 2,
        isOrchestrator: true,
        cooldownActive: false,
        maxContinuationsReached: true,
        explicitStopRequested: false,
        pendingTimerActive: false,
        injectionInFlight: false,
      }),
    ).toEqual({ action: 'noop', reason: 'max_continuations_reached' });
  });

  test('does nothing when no todos remain', () => {
    expect(
      decideTodoContinuation({
        incompleteTodoCount: 0,
        isOrchestrator: true,
        cooldownActive: false,
        maxContinuationsReached: false,
        explicitStopRequested: false,
        pendingTimerActive: false,
        injectionInFlight: false,
      }),
    ).toEqual({ action: 'noop', reason: 'no_incomplete_todos' });
  });
});
