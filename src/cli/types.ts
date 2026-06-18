export type BooleanArg = 'yes' | 'no';
export type PromptArg = 'ask' | 'yes' | 'no';

export interface InstallArgs {
  tui: boolean;
  skills?: BooleanArg;
  backgroundSubagents?: PromptArg;
  preset?: string;
  boardProvider?: string;
  dryRun?: boolean;
  reset?: boolean;
}

export interface OpenCodeConfig {
  plugin?: unknown[];
  provider?: Record<string, unknown>;
  agent?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface InstallConfig {
  hasTmux: boolean;
  installSkills: boolean;
  backgroundSubagents: PromptArg;
  preset?: string;
  boardProvider?: string;
  promptForStar?: boolean;
  dryRun?: boolean;
  reset: boolean;
}

export interface ConfigMergeResult {
  success: boolean;
  configPath: string;
  error?: string;
}

export interface DetectedConfig {
  isInstalled: boolean;
  hasKimi: boolean;
  hasOpenAI: boolean;
  hasAnthropic?: boolean;
  hasCopilot?: boolean;
  hasZaiPlan?: boolean;
  hasAntigravity: boolean;
  hasChutes?: boolean;
  hasOpencodeZen: boolean;
  hasTmux: boolean;
}
