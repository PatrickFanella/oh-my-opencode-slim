export interface TodoContinuationFacts {
  isOrchestrator: boolean;
  incompleteTodoCount: number;
  cooldownActive: boolean;
  maxContinuationsReached: boolean;
  explicitStopRequested: boolean;
  pendingTimerActive: boolean;
  injectionInFlight: boolean;
}

export type TodoContinuationDecision =
  | { action: 'continue' }
  | { action: 'suppress'; reason: 'explicit_stop' | 'cooldown' }
  | {
      action: 'noop';
      reason:
        | 'not_orchestrator'
        | 'no_incomplete_todos'
        | 'max_continuations_reached'
        | 'pending_timer';
    };

export function decideTodoContinuation(
  facts: TodoContinuationFacts,
): TodoContinuationDecision {
  if (!facts.isOrchestrator) {
    return { action: 'noop', reason: 'not_orchestrator' };
  }

  if (facts.explicitStopRequested) {
    return { action: 'suppress', reason: 'explicit_stop' };
  }

  if (facts.cooldownActive) {
    return { action: 'suppress', reason: 'cooldown' };
  }

  if (facts.maxContinuationsReached) {
    return { action: 'noop', reason: 'max_continuations_reached' };
  }

  if (facts.pendingTimerActive || facts.injectionInFlight) {
    return { action: 'noop', reason: 'pending_timer' };
  }

  if (facts.incompleteTodoCount <= 0) {
    return { action: 'noop', reason: 'no_incomplete_todos' };
  }

  return { action: 'continue' };
}
