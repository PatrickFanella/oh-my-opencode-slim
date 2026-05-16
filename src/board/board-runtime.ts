import type { BoardConfig } from '../config/schema';
import { decideBoardAction } from './board-policy';
import { createBoardRegistry } from './board-registry';
import { routeBoardRequest } from './board-router';
import { type BoardDecisionRecord, createBoardState } from './board-state';

export type BoardRuntime = {
  route(input: string): BoardDecisionRecord;
  getRecentDecisions(): BoardDecisionRecord[];
};

export function createBoardRuntime(
  config: BoardConfig | undefined,
): BoardRuntime {
  const registry = createBoardRegistry(config);
  const state = createBoardState();

  return {
    route(input) {
      const decision = routeBoardRequest(registry, input);
      const action = decideBoardAction(decision);
      return state.add({ decision, action });
    },
    getRecentDecisions() {
      return state.recent();
    },
  };
}
