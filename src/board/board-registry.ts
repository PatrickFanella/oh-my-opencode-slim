import type { BoardRegistry, BoardRuntimeConfig } from './board-schema';

export function createBoardRegistry(config: BoardRuntimeConfig): BoardRegistry {
  if (!config?.enabled) {
    return {
      enabled: false,
      mode: 'off',
      councilEscalation: false,
      roles: [],
    };
  }

  const roles = Object.entries(config.roles ?? {})
    .map(([id, role]) => ({ id, ...role }))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  return {
    enabled: true,
    mode: config.defaultMode,
    councilEscalation: config.councilEscalation,
    roles,
  };
}
