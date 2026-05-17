import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { copyFile, cp } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { crossSpawn } from '../utils/compat';
import { parseConfig, writeConfig } from './config-io';
import { install } from './install';
import {
  ensureOpenCodeConfigDir,
  getConfigDir,
  getExistingConfigPath,
  getExistingLiteConfigPath,
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
  scheduledTasks: 'opencode-scheduled-tasks',
} as const;

const OPENCODE_INSTALL_COMMAND =
  'curl -fsSL https://opencode.ai/install | bash';
const RTK_INSTALL_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh';
const RTK_INIT_COMMAND = 'rtk init -g --opencode --auto-patch';
const SCHEDULED_TASKS_INSTALL_DAEMON_COMMAND =
  'npx -y opencode-scheduled-tasks --install';
const SCHEDULED_TASKS_INSTALL_SKILL_COMMAND =
  'npx -y opencode-scheduled-tasks --install-skill';
const HELPER_START = '# >>> oh-my-opencode-slim tmux helper >>>';
const HELPER_END = '# <<< oh-my-opencode-slim tmux helper <<<';

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
  skipScheduledTasksSkill?: boolean;
  withDcp?: boolean;
  withQuota?: boolean;
  withRtk?: boolean;
  withScheduledTasks?: boolean;
  opencodeInstallCommand?: string;
  rtkInstallCommand?: string;
  scheduledTasksDaemonCommand?: string;
  scheduledTasksSkillCommand?: string;
}

interface StepResult {
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
    } else if (arg === '--skip-scheduled-tasks-skill') {
      result.skipScheduledTasksSkill = true;
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
    } else if (arg.startsWith('--scheduled-tasks-skill-cmd=')) {
      result.scheduledTasksSkillCommand = arg.slice(
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

async function backupIfExists(
  sourcePath: string,
  backupDir: string,
): Promise<boolean> {
  if (!existsSync(sourcePath)) return false;
  mkdirSync(backupDir, { recursive: true });
  const targetPath = join(backupDir, basename(sourcePath));
  if (statSync(sourcePath).isDirectory()) {
    await cp(sourcePath, targetPath, { recursive: true });
  } else {
    await copyFile(sourcePath, targetPath);
  }
  return true;
}

export async function backupOpenCodeConfig(
  dryRun = false,
): Promise<StepResult> {
  const configDir = getConfigDir();
  const backupDir = join(configDir, 'backups', `omoc-bootstrap-${timestamp()}`);
  const targets = [
    getExistingConfigPath(),
    getExistingTuiConfigPath(),
    getExistingLiteConfigPath(),
    join(configDir, 'oh-my-opencode-slim', 'agents'),
    join(configDir, 'tasks'),
    join(configDir, '.tasks.db'),
    join(configDir, 'dcp.jsonc'),
    join(configDir, 'dcp.json'),
  ];

  if (!existsSync(configDir)) {
    return { ok: true, message: 'No existing OpenCode config directory found' };
  }

  if (dryRun) {
    return { ok: true, message: `Would back up config files to ${backupDir}` };
  }

  let count = 0;
  for (const target of Array.from(new Set(targets))) {
    if (await backupIfExists(target, backupDir)) count += 1;
  }

  return count > 0
    ? { ok: true, message: `Backed up ${count} config files to ${backupDir}` }
    : {
        ok: true,
        message: 'Config directory exists; no known config files found',
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
  if (!args.skipScheduledTasksSkill) {
    commands.push(
      args.scheduledTasksSkillCommand ?? SCHEDULED_TASKS_INSTALL_SKILL_COMMAND,
    );
  }

  if (commands.length === 0) {
    return { ok: true, message: 'Skipped scheduled tasks daemon and skill' };
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
      ? 'Scheduled tasks skill installed'
      : 'Scheduled tasks daemon installed and initialized',
  };
}

function getPluginSpec(entry: unknown): string | undefined {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry) && typeof entry[0] === 'string') return entry[0];
  return undefined;
}

export function addPluginsToConfig(
  config: OpenCodeConfig,
  pluginSpecs: readonly string[],
): OpenCodeConfig {
  const plugins = Array.isArray(config.plugin) ? [...config.plugin] : [];
  const existing = new Set(plugins.map(getPluginSpec).filter(Boolean));

  for (const pluginSpec of pluginSpecs) {
    if (!existing.has(pluginSpec)) {
      plugins.push(pluginSpec);
      existing.add(pluginSpec);
    }
  }

  return { ...config, plugin: plugins };
}

async function installOptionalPlugins(
  args: BootstrapArgs,
): Promise<StepResult> {
  const pluginSpecs: string[] = [];
  if (args.withDcp) pluginSpecs.push(OPTIONAL_PLUGINS.dcp);
  if (args.withQuota) pluginSpecs.push(OPTIONAL_PLUGINS.quota);
  if (args.withScheduledTasks) {
    pluginSpecs.push(OPTIONAL_PLUGINS.scheduledTasks);
  }

  if (pluginSpecs.length === 0) {
    return { ok: true, message: 'No optional plugins selected' };
  }

  const configPath = getExistingConfigPath();
  if (args.dryRun) {
    return {
      ok: true,
      message: `Would add plugins to ${configPath}: ${pluginSpecs.join(', ')}`,
    };
  }

  ensureOpenCodeConfigDir();
  const { config, error } = parseConfig(configPath);
  if (error) {
    return { ok: false, message: `Failed to parse ${configPath}: ${error}` };
  }

  writeConfig(configPath, addPluginsToConfig(config ?? {}, pluginSpecs));
  return {
    ok: true,
    message: `Added optional plugins: ${pluginSpecs.join(', ')}`,
  };
}

export function tmuxHelperBlock(): string {
  return `${HELPER_START}
omos() {
  local port
  if command -v shuf >/dev/null 2>&1; then
    port="$(shuf -i 49152-65535 -n 1)"
  elif command -v jot >/dev/null 2>&1; then
    port="$(jot -r 1 49152 65535)"
  else
    port="$((49152 + RANDOM % 16384))"
  fi
  OPENCODE_PORT="$port" opencode --port "$port" "$@"
}
${HELPER_END}`;
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

  const total = 9;
  let index = 1;

  if (
    !(await step(index++, total, 'Back up OpenCode config', () =>
      backupOpenCodeConfig(args.dryRun),
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
    !(await step(index++, total, 'Install tmux shell helper', () =>
      installShellHelper(args),
    ))
  )
    return 1;

  printSummary();
  return 0;
}
