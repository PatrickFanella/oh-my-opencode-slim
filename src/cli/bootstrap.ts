import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { cp } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { crossSpawn } from '../utils/compat';
import { parseConfig, writeConfig } from './config-io';
import { install } from './install';
import {
  ensureOpenCodeConfigDir,
  getConfigDir,
  getExistingConfigPath,
  getExistingTuiConfigPath,
} from './paths';
import { isOpenCodeInstalled, isTmuxInstalled } from './system';
import type { BooleanArg, InstallArgs, OpenCodeConfig } from './types';

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const OPTIONAL_PLUGINS = {
  dcp: '@tarquinen/opencode-dcp@latest',
  quota: '@slkiser/opencode-quota',
  scheduledTasks: 'opencode-tasks',
} as const;
const OPTIONAL_TUI_PLUGINS = {
  quota: '@slkiser/opencode-quota',
} as const;

const OPENCODE_INSTALL_COMMAND =
  'curl -fsSL https://opencode.ai/install | bash';
const RTK_INSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh';
const RTK_INIT_COMMAND = 'rtk init -g --opencode --auto-patch';
const SCHEDULED_TASKS_INSTALL_DAEMON_COMMAND = 'bunx opencode-tasks --install';
const SCHEDULED_TASKS_INSTALL_COMMANDS_COMMAND =
  'bunx opencode-tasks --install-commands';
const HELPER_START = '# >>> oh-my-opencode-slim tmux helper >>>';
const HELPER_END = '# <<< oh-my-opencode-slim tmux helper <<<';
const DCP_SCHEMA_URL =
  'https://raw.githubusercontent.com/Opencode-DCP/opencode-dynamic-context-pruning/master/dcp.schema.json';
const OPENCODE_PLUGIN_PACKAGE_VERSION = '1.15.3';
const OPENCODE_PLUGIN_TYPES_PACKAGE = {
  dependencies: {
    '@opencode-ai/plugin': OPENCODE_PLUGIN_PACKAGE_VERSION,
  },
} as const;
const OPENCODE_CONFIG_GITIGNORE = `node_modules
package.json
package-lock.json
bun.lock
.gitignore
`;

const BOOTSTRAP_COMPACTION_DEFAULTS = {
  auto: false,
  prune: true,
  reserved: 10_000,
} as const;

const QUOTA_TOAST_DEFAULTS = {
  enableToast: false,
  showSessionTokens: true,
  enabledProviders: 'auto',
  formatStyle: 'allWindows',
  percentDisplayMode: 'used',
  tuiSidebarPanel: {
    enabled: true,
  },
  tuiCompactStatus: {
    enabled: true,
    homeBottom: true,
    sessionPrompt: true,
    suppressWhenNativeProviderQuota: true,
  },
} as const;

const DCP_DEFAULTS = {
  $schema: DCP_SCHEMA_URL,
  enabled: true,
  debug: false,
  autoUpdate: true,
  commands: {
    enabled: true,
    protectedTools: [],
  },
  compress: {
    mode: 'range',
    permission: 'allow',
    minContextLimit: '35%',
    maxContextLimit: '65%',
    iterationNudgeThreshold: 15,
    nudgeFrequency: 5,
    nudgeForce: 'soft',
    protectTags: false,
    protectUserMessages: false,
    protectedTools: [],
    showCompression: false,
    summaryBuffer: true,
  },
  experimental: {
    allowSubAgents: true,
    customPrompts: false,
  },
  manualMode: {
    enabled: false,
    automaticStrategies: true,
  },
  strategies: {
    deduplication: {
      enabled: true,
    },
    purgeErrors: {
      enabled: true,
      turns: 4,
    },
  },
  turnProtection: {
    enabled: false,
    turns: 4,
  },
  protectedFilePatterns: [],
  pruneNotification: 'detailed',
  pruneNotificationType: 'chat',
} as const;

export interface BootstrapArgs {
  dryRun?: boolean;
  yes?: boolean;
  reset?: boolean;
  skills?: BooleanArg;
  preset?: string;
  skipOpencode?: boolean;
  skipBuild?: boolean;
  skipShellHelper?: boolean;
  skipRtkInit?: boolean;
  skipScheduledTasksDaemon?: boolean;
  skipScheduledTasksCommands?: boolean;
  withDcp?: boolean;
  withQuota?: boolean;
  withRtk?: boolean;
  withScheduledTasks?: boolean;
  opencodeInstallCommand?: string;
  rtkInstallCommand?: string;
  scheduledTasksDaemonCommand?: string;
  scheduledTasksCommandsCommand?: string;
}

export interface StepResult {
  ok: boolean;
  message: string;
}

export function parseBootstrapArgs(args: string[]): BootstrapArgs {
  const result: BootstrapArgs = { skills: 'yes' };

  for (const arg of args) {
    if (arg === '--dry-run') result.dryRun = true;
    else if (arg === '--yes' || arg === '-y') result.yes = true;
    else if (arg === '--reset') result.reset = true;
    else if (arg === '--skip-opencode') result.skipOpencode = true;
    else if (arg === '--skip-build') result.skipBuild = true;
    else if (arg === '--skip-shell-helper') result.skipShellHelper = true;
    else if (arg === '--skip-rtk-init') result.skipRtkInit = true;
    else if (arg === '--skip-scheduled-tasks-daemon') {
      result.skipScheduledTasksDaemon = true;
    } else if (
      arg === '--skip-scheduled-tasks-commands' ||
      arg === '--skip-scheduled-tasks-skill'
    ) {
      result.skipScheduledTasksCommands = true;
    } else if (arg === '--with-dcp') result.withDcp = true;
    else if (arg === '--with-quota') result.withQuota = true;
    else if (arg === '--with-rtk') result.withRtk = true;
    else if (arg === '--with-scheduled-tasks') result.withScheduledTasks = true;
    else if (arg === '--no-dcp') result.withDcp = false;
    else if (arg === '--no-quota') result.withQuota = false;
    else if (arg === '--no-rtk') result.withRtk = false;
    else if (arg === '--no-scheduled-tasks') result.withScheduledTasks = false;
    else if (arg.startsWith('--skills=')) {
      result.skills = arg.split('=')[1] as BooleanArg;
    } else if (arg.startsWith('--preset=')) {
      result.preset = arg.split('=')[1];
    } else if (arg.startsWith('--opencode-install-cmd=')) {
      result.opencodeInstallCommand = arg.slice(
        '--opencode-install-cmd='.length,
      );
    } else if (arg.startsWith('--rtk-install-cmd=')) {
      result.rtkInstallCommand = arg.slice('--rtk-install-cmd='.length);
    } else if (arg.startsWith('--scheduled-tasks-daemon-cmd=')) {
      result.scheduledTasksDaemonCommand = arg.slice(
        '--scheduled-tasks-daemon-cmd='.length,
      );
    } else if (arg.startsWith('--scheduled-tasks-commands-cmd=')) {
      result.scheduledTasksCommandsCommand = arg.slice(
        '--scheduled-tasks-commands-cmd='.length,
      );
    } else if (arg.startsWith('--scheduled-tasks-skill-cmd=')) {
      result.scheduledTasksCommandsCommand = arg.slice(
        '--scheduled-tasks-skill-cmd='.length,
      );
    } else {
      throw new Error(`Unknown bootstrap option: ${arg}`);
    }
  }

  return result;
}

function printHeader(): void {
  console.log();
  console.log(`${BOLD}OMOC Bootstrap${RESET}`);
  console.log(
    `${DIM}Fully automated OpenCode + oh-my-opencode-slim setup${RESET}`,
  );
  console.log();
}

function renderStep(index: number, total: number, title: string): void {
  console.log(`${DIM}[${index}/${total}]${RESET} ${BOLD}${title}${RESET}`);
}

function renderResult(result: StepResult): void {
  const icon = result.ok ? `${GREEN}[ok]${RESET}` : `${RED}[x]${RESET}`;
  console.log(`  ${icon} ${result.message}`);
}

function renderInfo(message: string): void {
  console.log(`  ${BLUE}[i]${RESET} ${message}`);
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeWithDefaults(
  existing: unknown,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const base = isRecord(existing) ? { ...existing } : {};

  for (const [key, value] of Object.entries(defaults)) {
    if (isRecord(value)) {
      base[key] = mergeWithDefaults(base[key], value);
    } else if (Array.isArray(value)) {
      base[key] = [...value];
    } else {
      base[key] = value;
    }
  }

  return base;
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== 'string' || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

export function applyBootstrapHostDefaults(
  config: OpenCodeConfig,
  options: {
    skillsPath?: string | null;
    removeSkillPaths?: readonly string[];
  } = {},
): OpenCodeConfig {
  const next: OpenCodeConfig = { ...config };
  next.permission = 'allow';
  next.compaction = mergeWithDefaults(
    next.compaction,
    BOOTSTRAP_COMPACTION_DEFAULTS,
  );

  if (options.skillsPath || options.removeSkillPaths?.length) {
    const skills = isRecord(next.skills) ? { ...next.skills } : {};
    const removePaths = new Set(options.removeSkillPaths ?? []);
    const paths = uniqueStrings(
      (Array.isArray(skills.paths) ? skills.paths : []).filter(
        (path) => typeof path === 'string' && !removePaths.has(path),
      ),
    );

    if (options.skillsPath) {
      paths.push(options.skillsPath);
    }

    if (paths.length > 0) {
      skills.paths = uniqueStrings(paths);
      next.skills = skills;
    } else {
      delete skills.paths;
      if (Object.keys(skills).length > 0) {
        next.skills = skills;
      } else {
        delete next.skills;
      }
    }
  }

  return next;
}

export function buildDcpConfig(
  existing?: OpenCodeConfig | null,
): OpenCodeConfig {
  return mergeWithDefaults(existing ?? {}, DCP_DEFAULTS);
}

export function buildQuotaToastConfig(
  existing?: OpenCodeConfig | null,
): OpenCodeConfig {
  return mergeWithDefaults(existing ?? {}, QUOTA_TOAST_DEFAULTS);
}

export async function backupOpenCodeConfig(
  dryRun = false,
): Promise<StepResult> {
  const configDir = getConfigDir();
  const backupDir = join(configDir, 'backups', `omoc-bootstrap-${timestamp()}`);

  if (!existsSync(configDir)) {
    return { ok: true, message: 'No existing OpenCode config directory found' };
  }

  if (dryRun) {
    return {
      ok: true,
      message: `Would back up OpenCode config directory to ${backupDir}`,
    };
  }

  mkdirSync(backupDir, { recursive: true });
  const entries = readdirSync(configDir).filter((entry) => entry !== 'backups');
  for (const entry of entries) {
    await cp(join(configDir, entry), join(backupDir, entry), {
      recursive: true,
      force: true,
    });
  }

  return entries.length > 0
    ? {
        ok: true,
        message: `Backed up OpenCode config directory to ${backupDir}`,
      }
    : {
        ok: true,
        message: 'Config directory exists; no files found outside backups',
      };
}

export function resetOpenCodeConfigDirectory(dryRun = false): StepResult {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    if (!dryRun) mkdirSync(join(configDir, 'backups'), { recursive: true });
    return { ok: true, message: 'Initialized empty OpenCode config directory' };
  }

  const entries = readdirSync(configDir).filter((entry) => entry !== 'backups');
  if (dryRun) {
    return {
      ok: true,
      message: `Would remove ${entries.length} existing entries outside backups`,
    };
  }

  for (const entry of entries) {
    rmSync(join(configDir, entry), { recursive: true, force: true });
  }
  mkdirSync(join(configDir, 'backups'), { recursive: true });

  return {
    ok: true,
    message: `Reset OpenCode config directory; preserved backups`,
  };
}

async function runCommand(
  command: string,
  dryRun = false,
): Promise<StepResult> {
  if (dryRun) return { ok: true, message: `Would run: ${command}` };

  const proc = crossSpawn(['bash', '-lc', command], {
    stdout: 'inherit',
    stderr: 'inherit',
  });
  await proc.exited;
  return proc.exitCode === 0
    ? { ok: true, message: command }
    : { ok: false, message: `${command} exited with code ${proc.exitCode}` };
}

async function isCommandAvailable(command: string): Promise<boolean> {
  const proc = crossSpawn(['bash', '-lc', `command -v ${command}`], {
    stdout: 'ignore',
    stderr: 'ignore',
  });
  await proc.exited;
  return proc.exitCode === 0;
}

async function ensureOpenCode(args: BootstrapArgs): Promise<StepResult> {
  if (args.skipOpencode) {
    return { ok: true, message: 'Skipped OpenCode install/update' };
  }

  const installed = await isOpenCodeInstalled();
  renderInfo(installed ? 'Updating OpenCode' : 'Installing OpenCode');
  return runCommand(
    args.opencodeInstallCommand ?? OPENCODE_INSTALL_COMMAND,
    args.dryRun,
  );
}

async function ensureRepoBuild(args: BootstrapArgs): Promise<StepResult> {
  if (args.skipBuild) return { ok: true, message: 'Skipped repository build' };

  const installResult = await runCommand(
    'bun install --yes --ignore-scripts',
    args.dryRun,
  );
  if (!installResult.ok) return installResult;
  return runCommand('bun run build', args.dryRun);
}

async function installAndInitRtk(args: BootstrapArgs): Promise<StepResult> {
  if (!args.withRtk) return { ok: true, message: 'RTK not selected' };

  if (args.dryRun) {
    const commands = [args.rtkInstallCommand ?? RTK_INSTALL_COMMAND];
    if (!args.skipRtkInit) commands.push(`${RTK_INIT_COMMAND} --dry-run`);
    return { ok: true, message: `Would run: ${commands.join(' && ')}` };
  }

  const installed = await isCommandAvailable('rtk');
  if (!installed) {
    const installResult = await runCommand(
      args.rtkInstallCommand ?? RTK_INSTALL_COMMAND,
      false,
    );
    if (!installResult.ok) return installResult;
  } else {
    renderInfo('rtk detected; skipping binary install');
  }

  if (args.skipRtkInit) {
    return { ok: true, message: 'Skipped RTK OpenCode init' };
  }

  const initResult = await runCommand(RTK_INIT_COMMAND, false);
  if (!initResult.ok) return initResult;

  return {
    ok: true,
    message: installed
      ? 'RTK OpenCode integration initialized'
      : 'RTK installed and OpenCode integration initialized',
  };
}

async function installScheduledTasksDaemon(
  args: BootstrapArgs,
): Promise<StepResult> {
  if (!args.withScheduledTasks) {
    return { ok: true, message: 'Scheduled tasks not selected' };
  }

  const commands: string[] = [];
  if (!args.skipScheduledTasksDaemon) {
    commands.push(
      args.scheduledTasksDaemonCommand ??
        SCHEDULED_TASKS_INSTALL_DAEMON_COMMAND,
    );
  }
  if (!args.skipScheduledTasksCommands) {
    commands.push(
      args.scheduledTasksCommandsCommand ??
        SCHEDULED_TASKS_INSTALL_COMMANDS_COMMAND,
    );
  }

  if (commands.length === 0) {
    return { ok: true, message: 'Skipped scheduled tasks daemon and commands' };
  }

  if (args.dryRun) {
    return { ok: true, message: `Would run: ${commands.join(' && ')}` };
  }

  for (const command of commands) {
    const result = await runCommand(command, false);
    if (!result.ok) return result;
  }

  return {
    ok: true,
    message: args.skipScheduledTasksDaemon
      ? 'Scheduled tasks commands installed'
      : 'Scheduled tasks daemon and commands installed',
  };
}

function getPluginSpec(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry) && typeof entry[0] === 'string') return entry[0];
  return undefined;
}

function isOmocPluginSpec(pluginSpec: string): boolean {
  return pluginSpec.includes('oh-my-opencode-slim');
}

export function addPluginsToConfig(
  config: OpenCodeConfig,
  pluginSpecs: readonly string[],
): OpenCodeConfig {
  const plugins = Array.isArray(config.plugin) ? [...config.plugin] : [];
  const existing = new Set(plugins.map(getPluginSpec).filter(Boolean));
  const missingPlugins = pluginSpecs.filter((pluginSpec) => {
    if (existing.has(pluginSpec)) return false;
    existing.add(pluginSpec);
    return true;
  });

  const firstOmocIndex = plugins.findIndex((entry) => {
    const pluginSpec = getPluginSpec(entry);
    return pluginSpec ? isOmocPluginSpec(pluginSpec) : false;
  });

  if (firstOmocIndex === -1) plugins.push(...missingPlugins);
  else plugins.splice(firstOmocIndex, 0, ...missingPlugins);

  return { ...config, plugin: plugins };
}

function getOptionalOpenCodePluginSpecs(args: BootstrapArgs): string[] {
  const pluginSpecs: string[] = [];
  if (args.withDcp) pluginSpecs.push(OPTIONAL_PLUGINS.dcp);
  if (args.withQuota) pluginSpecs.push(OPTIONAL_PLUGINS.quota);
  if (args.withScheduledTasks) {
    pluginSpecs.push(OPTIONAL_PLUGINS.scheduledTasks);
  }
  return pluginSpecs;
}

function getOpenCodePackageCacheDir(packageName: string): string {
  const cacheDir =
    process.env.XDG_CACHE_HOME?.trim() || join(homedir(), '.cache');
  return join(cacheDir, 'opencode', 'packages', `${packageName}@latest`);
}

export function getScheduledTasksPluginCacheDir(): string {
  return getOpenCodePackageCacheDir(OPTIONAL_PLUGINS.scheduledTasks);
}

export function buildScheduledTasksPluginCacheManifest(): string {
  return `${JSON.stringify(
    {
      dependencies: {
        [OPTIONAL_PLUGINS.scheduledTasks]: 'latest',
        '@opencode-ai/plugin': OPENCODE_PLUGIN_PACKAGE_VERSION,
      },
    },
    null,
    2,
  )}\n`;
}

function verifyScheduledTasksPluginCache(cacheDir: string): StepResult | null {
  const expectedPackageJsons = [
    join(
      cacheDir,
      'node_modules',
      OPTIONAL_PLUGINS.scheduledTasks,
      'package.json',
    ),
    join(cacheDir, 'node_modules', '@opencode-ai', 'plugin', 'package.json'),
  ];

  const missing = expectedPackageJsons.filter((path) => !existsSync(path));
  if (missing.length === 0) return null;

  return {
    ok: false,
    message: `Scheduled tasks plugin cache is missing: ${missing.join(', ')}`,
  };
}

export async function ensureScheduledTasksPluginCache(
  args: Pick<BootstrapArgs, 'dryRun' | 'withScheduledTasks'>,
): Promise<StepResult> {
  if (!args.withScheduledTasks) {
    return { ok: true, message: 'Scheduled tasks plugin cache not selected' };
  }

  const cacheDir = getScheduledTasksPluginCacheDir();
  if (args.dryRun) {
    return {
      ok: true,
      message: `Would prepare opencode-tasks plugin cache in ${cacheDir}`,
    };
  }

  try {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(
      join(cacheDir, 'package.json'),
      buildScheduledTasksPluginCacheManifest(),
    );
  } catch (err) {
    return {
      ok: false,
      message: `Failed to write scheduled tasks plugin cache manifest: ${err}`,
    };
  }

  try {
    const proc = crossSpawn(['bun', 'install', '--ignore-scripts'], {
      cwd: cacheDir,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    await proc.exited;

    if (proc.exitCode !== 0) {
      const [stdout, stderr] = await Promise.all([
        proc.stdout(),
        proc.stderr(),
      ]);
      const output = stderr.trim() || stdout.trim();
      return {
        ok: false,
        message:
          output ||
          `bun install --ignore-scripts exited with code ${proc.exitCode}`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      message: `Failed to prepare scheduled tasks plugin cache: ${err}`,
    };
  }

  const verificationError = verifyScheduledTasksPluginCache(cacheDir);
  if (verificationError) return verificationError;

  return {
    ok: true,
    message: 'Prepared opencode-tasks plugin cache with @opencode-ai/plugin',
  };
}

export function getOptionalTuiPluginSpecs(args: BootstrapArgs): string[] {
  const pluginSpecs: string[] = [];
  if (args.withQuota) pluginSpecs.push(OPTIONAL_TUI_PLUGINS.quota);
  return pluginSpecs;
}

async function installOptionalPlugins(
  args: BootstrapArgs,
): Promise<StepResult> {
  const pluginSpecs = getOptionalOpenCodePluginSpecs(args);
  const tuiPluginSpecs = getOptionalTuiPluginSpecs(args);

  if (pluginSpecs.length === 0 && tuiPluginSpecs.length === 0) {
    return { ok: true, message: 'No optional plugins selected' };
  }

  const configPath = getExistingConfigPath();
  const tuiConfigPath = getExistingTuiConfigPath();
  if (args.dryRun) {
    const messages: string[] = [];
    if (pluginSpecs.length > 0) {
      messages.push(`OpenCode ${configPath}: ${pluginSpecs.join(', ')}`);
    }
    if (tuiPluginSpecs.length > 0) {
      messages.push(`TUI ${tuiConfigPath}: ${tuiPluginSpecs.join(', ')}`);
    }
    return {
      ok: true,
      message: `Would add plugins to ${messages.join('; ')}`,
    };
  }

  ensureOpenCodeConfigDir();

  const { config, error } = parseConfig(configPath);
  if (error) {
    return { ok: false, message: `Failed to parse ${configPath}: ${error}` };
  }

  let parsedTuiConfig: OpenCodeConfig | null = null;
  if (tuiPluginSpecs.length > 0) {
    mkdirSync(dirname(tuiConfigPath), { recursive: true });
    const { config: tuiConfig, error: tuiError } = parseConfig(tuiConfigPath);
    if (tuiError) {
      return {
        ok: false,
        message: `Failed to parse ${tuiConfigPath}: ${tuiError}`,
      };
    }
    parsedTuiConfig = tuiConfig;
  }

  const scheduledTasksCacheResult = args.withScheduledTasks
    ? await ensureScheduledTasksPluginCache(args)
    : null;
  if (scheduledTasksCacheResult && !scheduledTasksCacheResult.ok) {
    return scheduledTasksCacheResult;
  }

  if (pluginSpecs.length > 0) {
    writeConfig(configPath, addPluginsToConfig(config ?? {}, pluginSpecs));
  }
  if (tuiPluginSpecs.length > 0) {
    writeConfig(
      tuiConfigPath,
      addPluginsToConfig(parsedTuiConfig ?? {}, tuiPluginSpecs),
    );
  }

  const messages = [`OpenCode: ${pluginSpecs.join(', ')}`];
  if (tuiPluginSpecs.length > 0) {
    messages.push(`TUI: ${tuiPluginSpecs.join(', ')}`);
  }
  if (scheduledTasksCacheResult) {
    messages.push(scheduledTasksCacheResult.message);
  }

  return {
    ok: true,
    message: `Added optional plugins: ${messages.join('; ')}`,
  };
}

function getExternalSkillsPath(): string {
  return join(homedir(), '.agents', 'skills');
}

function getExistingDcpConfigPath(): string {
  const configDir = getConfigDir();
  const jsoncPath = join(configDir, 'dcp.jsonc');
  const jsonPath = join(configDir, 'dcp.json');

  if (existsSync(jsoncPath) || !existsSync(jsonPath)) return jsoncPath;
  return jsonPath;
}

function getQuotaToastConfigPath(): string {
  return join(getConfigDir(), 'opencode-quota', 'quota-toast.json');
}

export function ensureDesiredOpenCodeDirectory(dryRun = false): StepResult {
  const configDir = getConfigDir();
  const targets = [
    join(configDir, 'backups'),
    join(configDir, 'commands'),
    join(configDir, 'oh-my-opencode-slim'),
    join(configDir, 'plugins'),
    join(configDir, 'skills'),
  ];

  if (dryRun) {
    return { ok: true, message: 'Would ensure expected OpenCode directories' };
  }

  for (const target of targets) {
    mkdirSync(target, { recursive: true });
  }

  writeFileSync(join(configDir, '.gitignore'), OPENCODE_CONFIG_GITIGNORE);
  writeFileSync(
    join(configDir, 'package.json'),
    `${JSON.stringify(OPENCODE_PLUGIN_TYPES_PACKAGE, null, 2)}\n`,
  );

  return { ok: true, message: 'Ensured expected OpenCode directory layout' };
}

async function applyBootstrapRuntimeDefaults(
  args: BootstrapArgs,
): Promise<StepResult> {
  const configPath = getExistingConfigPath();
  const dcpPath = getExistingDcpConfigPath();
  const quotaPath = getQuotaToastConfigPath();
  const configured = ['OpenCode permissions and compaction'];

  configured.push('remove legacy external skill path');
  if (args.withDcp) configured.push('DCP defaults');
  if (args.withQuota) configured.push('quota toast defaults');

  if (args.dryRun) {
    return {
      ok: true,
      message: `Would configure ${configured.join('; ')}`,
    };
  }

  ensureOpenCodeConfigDir();

  const { config, error } = parseConfig(configPath);
  if (error) {
    return { ok: false, message: `Failed to parse ${configPath}: ${error}` };
  }

  writeConfig(
    configPath,
    applyBootstrapHostDefaults(config ?? {}, {
      removeSkillPaths: [getExternalSkillsPath()],
    }),
  );

  if (args.withDcp) {
    const { config: dcpConfig, error: dcpError } = parseConfig(dcpPath);
    if (dcpError) {
      return { ok: false, message: `Failed to parse ${dcpPath}: ${dcpError}` };
    }
    mkdirSync(dirname(dcpPath), { recursive: true });
    writeConfig(dcpPath, buildDcpConfig(dcpConfig));
  }

  if (args.withQuota) {
    const { config: quotaConfig, error: quotaError } = parseConfig(quotaPath);
    if (quotaError) {
      return {
        ok: false,
        message: `Failed to parse ${quotaPath}: ${quotaError}`,
      };
    }
    mkdirSync(dirname(quotaPath), { recursive: true });
    writeConfig(quotaPath, buildQuotaToastConfig(quotaConfig));
  }

  return {
    ok: true,
    message: `Configured ${configured.join('; ')}`,
  };
}

export function tmuxHelperBlock(): string {
  return `${HELPER_START}
unalias opencode oc occ 2>/dev/null || true

__omoc_opencode_with_port() {
  local port
  if command -v shuf >/dev/null 2>&1; then
    port="$(shuf -i 49152-65535 -n 1)"
  elif command -v jot >/dev/null 2>&1; then
    port="$(jot -r 1 49152 65535)"
  else
    port="$((49152 + RANDOM % 16384))"
  fi
  # Bypass shell functions and aliases so the real opencode binary runs.
  OPENCODE_PORT="$port" command opencode --port "$port" "$@"
}

omos() {
  __omoc_opencode_with_port "$@"
}

opencode() {
  __omoc_opencode_with_port "$@"
}

oc() {
  __omoc_opencode_with_port "$@"
}

occ() {
  __omoc_opencode_with_port --continue "$@"
}
${HELPER_END}`;
}

function hasSafeLegacyHelper(content: string): boolean {
  if (
    !content.includes('omos()') ||
    !content.includes('OPENCODE_PORT="$port"')
  ) {
    return false;
  }

  const invokesBinarySafely = [
    'command opencode --port "$port" "$@"',
    'command "opencode" --port "$port" "$@"',
    '"$OPENCODE_BIN" --port "$port" "$@"',
  ].some((command) => content.includes(command));

  if (!invokesBinarySafely) return false;

  return (
    content.includes('opencode()') &&
    (content.includes('alias oc="omos"') || content.includes('oc()')) &&
    (content.includes('alias occ="omos --continue"') ||
      content.includes('occ()'))
  );
}

export function upsertManagedBlock(content: string, block: string): string {
  const startIndex = content.indexOf(HELPER_START);
  const endIndex = content.indexOf(HELPER_END);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const afterEnd = endIndex + HELPER_END.length;
    return `${content.slice(0, startIndex).trimEnd()}\n\n${block}\n${content
      .slice(afterEnd)
      .trimStart()}`;
  }

  if (hasSafeLegacyHelper(content)) {
    return content;
  }

  return `${content.trimEnd()}\n\n${block}\n`;
}

function shellRcCandidates(): string[] {
  const home = homedir();
  const bashrc = join(home, '.bashrc');
  const zshrc = join(home, '.zshrc');
  const shell = process.env.SHELL ?? '';

  if (shell.endsWith('/bash')) return [bashrc, zshrc];
  return [zshrc, bashrc];
}

async function installShellHelper(args: BootstrapArgs): Promise<StepResult> {
  if (args.skipShellHelper) {
    return { ok: true, message: 'Skipped tmux shell helper' };
  }

  const candidates = shellRcCandidates();
  const existing = candidates.filter((path) => existsSync(path));
  const targets = existing.length > 0 ? existing : [candidates[0]];

  if (args.dryRun) {
    return {
      ok: true,
      message: `Would install omos helper in ${targets.join(', ')}`,
    };
  }

  for (const target of targets) {
    const content = existsSync(target) ? readFileSync(target, 'utf-8') : '';
    writeFileSync(target, upsertManagedBlock(content, tmuxHelperBlock()));
  }

  return {
    ok: true,
    message: `Installed omos helper in ${targets.join(', ')}`,
  };
}

async function runOmocInstall(args: BootstrapArgs): Promise<StepResult> {
  if (args.dryRun) return { ok: true, message: 'Would run OMOC installer' };

  const installArgs: InstallArgs = {
    tui: false,
    skills: args.skills ?? 'yes',
    preset: args.preset,
    reset: args.reset,
  };

  const exitCode = await install(installArgs);
  return exitCode === 0
    ? { ok: true, message: 'OMOC installer completed' }
    : { ok: false, message: `OMOC installer exited with code ${exitCode}` };
}

function printSummary(): void {
  console.log();
  console.log(`${BOLD}${GREEN}Bootstrap complete${RESET}`);
  console.log();
  console.log(`${BOLD}Next:${RESET}`);
  console.log(`  ${BLUE}opencode auth login${RESET}`);
  console.log(`  ${BLUE}opencode models --refresh${RESET}`);
  console.log(
    `  ${BLUE}omos${RESET} ${DIM}# tmux-friendly OpenCode launcher${RESET}`,
  );
  console.log();
}

async function step(
  index: number,
  total: number,
  title: string,
  fn: () => Promise<StepResult>,
): Promise<boolean> {
  renderStep(index, total, title);
  const result = await fn();
  renderResult(result);
  console.log();
  return result.ok;
}

export async function bootstrap(args: BootstrapArgs): Promise<number> {
  printHeader();

  const total = 12;
  let index = 1;

  if (
    !(await step(index++, total, 'Back up OpenCode config', () =>
      backupOpenCodeConfig(args.dryRun),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Reset OpenCode config directory', async () =>
      resetOpenCodeConfigDirectory(args.dryRun),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Check tmux', async () => {
      const installed = await isTmuxInstalled();
      return installed
        ? { ok: true, message: 'tmux detected' }
        : {
            ok: true,
            message: 'tmux not found; install it for live agent panes',
          };
    }))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install or update OpenCode', () =>
      ensureOpenCode(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install dependencies and build repo', () =>
      ensureRepoBuild(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install oh-my-opencode-slim', () =>
      runOmocInstall(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install and init RTK', () =>
      installAndInitRtk(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install scheduled tasks daemon', () =>
      installScheduledTasksDaemon(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install optional OpenCode plugins', () =>
      installOptionalPlugins(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Apply trusted OpenCode defaults', () =>
      applyBootstrapRuntimeDefaults(args),
    ))
  )
    return 1;
  if (
    !(await step(index++, total, 'Install tmux shell helper', () =>
      installShellHelper(args),
    ))
  )
    return 1;
  if (
    !(await step(
      index++,
      total,
      'Finalize OpenCode config directory',
      async () => ensureDesiredOpenCodeDirectory(args.dryRun),
    ))
  )
    return 1;

  printSummary();
  return 0;
}
