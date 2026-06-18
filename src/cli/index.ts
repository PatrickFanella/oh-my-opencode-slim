#!/usr/bin/env bun
import { pathToFileURL } from 'node:url';

export { CUSTOM_SKILLS } from './custom-skills';

import { agents, parseAgentsArgs, printAgentsCommandHelp } from './agents';
import { bootstrap, parseBootstrapArgs } from './bootstrap';
import {
  controlCenter,
  parseControlCenterArgs,
  printControlCenterHelp,
} from './control-center';
import {
  controlCenterWeb,
  parseControlCenterWebArgs,
  printControlCenterWebHelp,
} from './control-center-web';
import { doctor, parseDoctorArgs } from './doctor';
import { install } from './install';
import {
  BOARD_AGENT_MODEL_TIERS,
  getBoardProviderNames,
  getGeneratedPresetNames,
  isBoardProviderName,
  isGeneratedPresetName,
} from './providers';
import {
  expandShortcutArgs,
  formatShortcutHelpSection,
  hasHelpFlag,
  isShortcutCommand,
} from './shortcuts';
import type { BooleanArg, InstallArgs, PromptArg } from './types';

function isPromptArg(value: string): value is PromptArg {
  return value === 'ask' || value === 'yes' || value === 'no';
}

function parseArgs(args: string[]): InstallArgs {
  const result: InstallArgs = {
    tui: true,
    skills: 'yes',
  };

  for (const arg of args) {
    if (arg === '--no-tui') {
      result.tui = false;
    } else if (arg.startsWith('--skills=')) {
      result.skills = arg.split('=')[1] as BooleanArg;
    } else if (arg.startsWith('--background-subagents=')) {
      const mode = arg.split('=')[1];
      if (!isPromptArg(mode)) {
        console.error(
          `Unsupported background subagents mode: ${mode}. Use ask, yes, or no.`,
        );
        process.exit(1);
      }
      result.backgroundSubagents = mode;
    } else if (arg.startsWith('--preset=')) {
      const preset = arg.split('=')[1];
      if (!isGeneratedPresetName(preset)) {
        console.error(
          `Unsupported preset: ${preset}. Available presets: ${getGeneratedPresetNames().join(', ')}`,
        );
        process.exit(1);
      }
      result.preset = preset;
    } else if (arg.startsWith('--board-provider=')) {
      const provider = arg.split('=')[1];
      if (!isBoardProviderName(provider)) {
        console.error(
          `Unsupported board provider: ${provider}. Available: ${getBoardProviderNames().join(', ')}`,
        );
        process.exit(1);
      }
      result.boardProvider = provider;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--reset') {
      result.reset = true;
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
blacktower installer

Usage:
  bunx blacktower install [OPTIONS]
  bunx blacktower bootstrap [OPTIONS]
  bunx blacktower control-center [OPTIONS]
  bunx blacktower control-center-web [OPTIONS]
  bunx blacktower agents <list|validate|create> [OPTIONS]
  bunx blacktower switch-agents [provider] [--dry-run]
  bunx blacktower doctor [OPTIONS]

Options:
  --skills=yes|no        Enable code-managed bundled skills (default: yes)
  --background-subagents=ask|yes|no
                          Enable native OpenCode background-subagent env var
  --preset=<name>        Active generated config preset (default: openai)
  --board-provider=<p>   Board agent model provider (github-copilot|openai|anthropic|gemini)
  --no-tui               Non-interactive mode
  --dry-run              Simulate install without writing files
  --reset                Force overwrite of existing configuration
  -h, --help             Show this help message

Bootstrap options:
  --with-dcp             Add @tarquinen/opencode-dcp@latest to OpenCode plugins
  --with-quota           Add @slkiser/opencode-quota to OpenCode/TUI plugins
  --with-rtk             Install rtk and run rtk init -g --opencode --auto-patch
  --with-scheduled-tasks Add opencode-tasks and install daemon/commands (default)
  --no-scheduled-tasks   Skip opencode-tasks plugin, daemon, commands, templates
  --skip-scheduled-task-templates
                         Skip writing bundled scheduled task templates
  --yes, -y              Non-interactive bootstrap confirmation flag
  --skip-opencode        Skip OpenCode install/update
  --skip-build           Skip bun install and bun run build
  --skip-shell-helper    Skip tmux-friendly OpenCode shell helper install
  --skip-rtk-init        Install rtk but skip rtk init
  --skip-scheduled-tasks-daemon
                         Add plugin but skip launchd/systemd daemon install
  --skip-scheduled-tasks-commands
                         Add plugin/daemon but skip /loop command install
  --opencode-install-cmd=<cmd>
                         Override OpenCode install/update command
  --rtk-install-cmd=<cmd>
                         Override RTK install command
  --scheduled-tasks-daemon-cmd=<cmd>
                         Override scheduled-tasks daemon install command
  --scheduled-tasks-commands-cmd=<cmd>
                         Override scheduled-tasks command install command

${formatShortcutHelpSection()}

Agents commands:
  agents list [--json]       List built-in and custom JSON agents
  agents validate [--json]   Validate custom JSON agents
  agents create <name> --model=<provider/model>
                             Create a custom JSON agent definition

Control center options:
  --no-tui               Print a task/scheduler snapshot and exit
  --json                 Print the backend snapshot as JSON and exit
  --config-dir=<path>    Read an alternate OpenCode config directory

Control center web options:
  --host=<host>           Host to bind (default: 127.0.0.1)
  --port=<port>           Port to bind (default: 47671)
  --api-only              Serve only the read-only API
  --allow-network         Permit non-loopback hosts; exposes task metadata
  --open                  Open the dashboard URL in the default browser

Doctor options:
  --json                 Print diagnostics as JSON

Available presets: ${getGeneratedPresetNames().join(', ')}

The installer writes only the selected generated preset.
OpenAI is active unless --preset selects another generated preset.
Install writes built-in MCP definitions to OpenCode config for native auth.
Bootstrap applies trusted host defaults: permission allow, compaction, and
selected DCP/quota sidecar config.
For the full config reference, see docs/configuration.md.

Examples:
  bunx blacktower install
  bunx blacktower install --no-tui --skills=yes
  bunx blacktower install --preset=opencode-go
  bunx blacktower install --reset
  bunx blacktower bootstrap --with-dcp --with-quota --with-rtk
  bunx blacktower setup
  bunx blacktower preview
  bunx blacktower update
  bunx blacktower repair
  bunx blacktower control-center
  bunx blacktower control-center --no-tui
  bunx blacktower control-center-web --open
  bunx blacktower agents list
  bunx blacktower doctor
`);
}

// ── switch-agents command ─────────────────────────────────────────────────────
import { switchProviderConfig } from './config-io';

async function switchAgents(args: string[]): Promise<number> {
  const GREEN = '\x1b[32m';
  const BLUE = '\x1b[34m';
  const RESET = '\x1b[0m';
  const DIM = '\x1b[2m';

  const provider = args.find((a) => !a.startsWith('-'));
  const dryRun = args.includes('--dry-run');

  if (!provider) {
    // Show current state
    const { join } = await import('node:path');
    const { existsSync, readFileSync } = await import('node:fs');
    const { homedir } = await import('node:os');
    const agentsDir = join(
      homedir(),
      '.config',
      'opencode',
      'blacktower',
      'agents',
    );
    const sampleFile = join(agentsDir, 'python-advisor.json');
    let currentProvider = 'unknown';
    if (existsSync(sampleFile)) {
      try {
        const def = JSON.parse(readFileSync(sampleFile, 'utf8'));
        currentProvider = (def.model as string)?.split('/')[0] ?? 'unknown';
      } catch {}
    }

    console.log(
      `Current board agent provider: ${BLUE}${currentProvider}${RESET}`,
    );
    console.log('');
    console.log('Available providers:');
    for (const [name, tiers] of Object.entries(BOARD_AGENT_MODEL_TIERS)) {
      console.log(
        `  ${name.padEnd(18)} coding: ${tiers.coding.padEnd(38)} heavy: ${tiers.heavy.padEnd(38)} light: ${tiers.light}`,
      );
    }
    console.log('');
    console.log(`Usage: bunx blacktower switch-agents <provider> [--dry-run]`);
    return 0;
  }

  if (!isBoardProviderName(provider)) {
    console.error(
      `Unknown provider: ${provider}. Available: ${getBoardProviderNames().join(', ')}`,
    );
    return 1;
  }

  const tiers = BOARD_AGENT_MODEL_TIERS[provider];
  console.log(`Switching board agents → provider: ${BLUE}${provider}${RESET}`);
  console.log(`  coding → ${tiers.coding}`);
  console.log(`  heavy  → ${tiers.heavy}`);
  console.log(`  light  → ${tiers.light}`);
  console.log('');

  const result = switchProviderConfig(provider, { dryRun });

  if (!result.success) {
    console.error(`Error: ${result.error}`);
    return 1;
  }

  for (const name of result.boardAgents.written) {
    console.log(
      `  ${GREEN}✓${RESET} ${name.padEnd(32)} ${DIM}→ written${RESET}`,
    );
  }
  for (const name of result.boardAgents.skipped) {
    console.log(`  ${DIM}~ ${name.padEnd(32)} → skipped (dry run)${RESET}`);
  }

  const configStatus = dryRun ? 'would update' : 'updated';
  console.log(
    `  ${GREEN}✓${RESET} built-in specialists ${DIM}→ ${configStatus} preset ${result.presetName} in ${result.configPath}${RESET}`,
  );

  console.log('');
  if (dryRun) {
    console.log('Dry run complete. No files written.');
  } else {
    console.log('Done. Restart opencode for changes to take effect.');
  }
  return 0;
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const expanded = rawArgs[0]
    ? expandShortcutArgs(rawArgs[0], rawArgs.slice(1))
    : { command: undefined, args: [] as string[] };

  if (
    rawArgs[0] &&
    isShortcutCommand(rawArgs[0]) &&
    hasHelpFlag(rawArgs.slice(1))
  ) {
    printHelp();
    process.exit(0);
  }

  if (!expanded.command || expanded.command === 'install') {
    const installArgs = parseArgs(expanded.args);
    const exitCode = await install(installArgs);
    process.exit(exitCode);
  } else if (expanded.command === 'bootstrap') {
    if (expanded.args[0] === '-h' || expanded.args[0] === '--help') {
      printHelp();
      process.exit(0);
    }
    const bootstrapArgs = parseBootstrapArgs(expanded.args);
    const exitCode = await bootstrap(bootstrapArgs);
    process.exit(exitCode);
  } else if (expanded.command === 'agents') {
    if (expanded.args[0] === '-h' || expanded.args[0] === '--help') {
      printAgentsCommandHelp();
      process.exit(0);
    }
    const agentsArgs = parseAgentsArgs(expanded.args);
    const exitCode = await agents(agentsArgs);
    process.exit(exitCode);
  } else if (expanded.command === 'control-center') {
    if (expanded.args[0] === '-h' || expanded.args[0] === '--help') {
      printControlCenterHelp();
      process.exit(0);
    }
    const controlCenterArgs = parseControlCenterArgs(expanded.args);
    const exitCode = await controlCenter(controlCenterArgs);
    process.exit(exitCode);
  } else if (expanded.command === 'control-center-web') {
    if (expanded.args[0] === '-h' || expanded.args[0] === '--help') {
      printControlCenterWebHelp();
      process.exit(0);
    }
    const controlCenterWebArgs = parseControlCenterWebArgs(expanded.args);
    const exitCode = await controlCenterWeb(controlCenterWebArgs);
    process.exit(exitCode);
  } else if (expanded.command === 'doctor') {
    const doctorArgs = parseDoctorArgs(expanded.args);
    const exitCode = await doctor(doctorArgs);
    process.exit(exitCode);
  } else if (expanded.command === 'switch-agents') {
    const exitCode = await switchAgents(expanded.args);
    process.exit(exitCode);
  } else if (expanded.command === '-h' || expanded.command === '--help') {
    printHelp();
    process.exit(0);
  } else {
    console.error(`Unknown command: ${expanded.command}`);
    console.error('Run with --help for usage information');
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
