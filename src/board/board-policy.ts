import type { BoardRouteDecision } from './board-router';

export type BoardAction =
  | { type: 'self'; reason: string }
  | { type: 'delegate'; agent: string; reason: string }
  | { type: 'council'; reason: string };

export function decideBoardAction(decision: BoardRouteDecision): BoardAction {
  if (decision.mode === 'off') {
    return { type: 'self', reason: 'Board mode is off.' };
  }

  if (!decision.primary) {
    return { type: 'self', reason: 'No board role matched the request.' };
  }

  if (
    decision.mode === 'decide' &&
    decision.councilEscalation &&
    decision.candidates.length > 1
  ) {
    return {
      type: 'council',
      reason: 'Board selected council escalation for multi-role decision.',
    };
  }

  if (decision.mode === 'advise') {
    return {
      type: 'delegate',
      agent: decision.primary.agent,
      reason: `Board selected ${decision.primary.title} for advice.`,
    };
  }

  return {
    type: 'delegate',
    agent: decision.primary.agent,
    reason: `Board selected ${decision.primary.title}.`,
  };
}
