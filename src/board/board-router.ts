import type { BoardMode, BoardRegistry, BoardRole } from './board-schema';

export type BoardRouteDecision = {
  input: string;
  mode: BoardMode;
  councilEscalation: boolean;
  primary?: BoardRole;
  candidates: BoardRole[];
};

function scoreRole(role: BoardRole, input: string): number {
  const normalized = input.toLowerCase();
  const terms = [role.title, role.purpose, ...role.when]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter(Boolean);

  const uniqueTerms = new Set(terms);
  let score = 0;
  for (const term of uniqueTerms) {
    if (normalized.includes(term)) score += 1;
  }

  return score;
}

export function routeBoardRequest(
  registry: BoardRegistry,
  input: string,
): BoardRouteDecision {
  if (!registry.enabled || registry.mode === 'off') {
    return {
      input,
      mode: registry.mode,
      councilEscalation: registry.councilEscalation,
      candidates: [],
    };
  }

  const scored = registry.roles
    .map((role) => ({ role, score: scoreRole(role, input) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.role.priority - a.role.priority ||
        a.role.id.localeCompare(b.role.id),
    );

  const candidates = scored.map((entry) => entry.role);
  return {
    input,
    mode: registry.mode,
    councilEscalation: registry.councilEscalation,
    primary: candidates[0],
    candidates,
  };
}
