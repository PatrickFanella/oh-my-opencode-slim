import type { BoardConfig, BoardRoleConfig } from '../config/schema';

export type BoardMode = 'off' | 'route' | 'advise' | 'decide';

export type BoardRole = BoardRoleConfig & {
  id: string;
};

export type BoardRegistry = {
  enabled: boolean;
  mode: BoardMode;
  councilEscalation: boolean;
  roles: BoardRole[];
};

export type BoardRuntimeConfig = BoardConfig | undefined;
