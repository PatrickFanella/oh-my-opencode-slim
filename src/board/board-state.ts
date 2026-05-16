import type { BoardAction } from './board-policy';
import type { BoardRouteDecision } from './board-router';

export type BoardDecisionRecord = {
  id: string;
  createdAt: string;
  decision: BoardRouteDecision;
  action: BoardAction;
};

export type BoardState = {
  add(
    record: Omit<BoardDecisionRecord, 'id' | 'createdAt'>,
  ): BoardDecisionRecord;
  recent(): BoardDecisionRecord[];
};

export function createBoardState(limit = 25): BoardState {
  const records: BoardDecisionRecord[] = [];
  let nextId = 1;

  return {
    add(record) {
      const stored = {
        id: `board-${nextId++}`,
        createdAt: new Date().toISOString(),
        ...record,
      };
      records.unshift(stored);
      records.splice(limit);
      return stored;
    },
    recent() {
      return [...records];
    },
  };
}
