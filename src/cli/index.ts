#!/usr/bin/env bun
import { pathToFileURL } from 'node:url';

export { CUSTOM_SKILLS } from './custom-skills';

import { agents, parseAgentsArgs, printAgentsCommandHelp } from './agents';
import { bootstrap, parseBootstrapArgs } from './bootstrap';
import { doctor, parseDoctorArgs } from './doctor';
import { install } from './install';
import { getGeneratedPresetNames, isGeneratedPresetName } from './providers';
import type { BooleanArg, InstallArgs } from './types';

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
    } else if (arg.startsWith('--preset=')) {
      const preset = arg.split('=')[1];
      if (!isGeneratedPresetName(preset)) {
        console.error(
          `Unsupported preset: ${preset}. Available presets: ${getGeneratedPresetNames().join(', ')}`,
        );
        process.exit(1);
      }
      result.preset = preset;
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
oh-my-opencode-slim installer

Usage:
  bunx oh-my-opencode-slim install [OPTIONS]
  bunx oh-my-opencode-slim bootstrap [OPTIONS]
  bunx oh-my-opencode-slim agents <list|validate|create> [OPTIONS]
  bunx oh-my-opencode-slim doctor [OPTIONS]

Options:
  --skills=yes|no        Install recommended and bundled skills (default: yes)
  --preset=<name>        Active generated config preset (default: openai)
  --no-tui               Non-interactive mode
  --dry-run              Simulate install without writing files
  --reset                Force overwrite of existing configuration
  -h, --help             Show this help message

Bootstrap options:
  --with-dcp             Add @tarquinen/opencode-dcp@latest to OpenCode plugins
  --with-quota           Add @slkiser/opencode-quota to OpenCode plugins
  --with-rtk             Install rtk and run rtk init -g --opencode --auto-patch
  --with-scheduled-tasks Add opencode-tasks and install daemon/skill
  --yes, -y              Non-interactive bootstrap confirmation flag
  --skip-opencode        Skip OpenCode install/update
  --skip-build           Skip bun install and bun run build
  --skip-shell-helper    Skip omos tmux helper install
  --skip-rtk-init        Install rtk but skip rtk init
  --skip-scheduled-tasks-daemon
                         Add plugin but skip launchd/systemd daemon install
  --skip-scheduled-tasks-skill
                         Add plugin/daemon but skip scheduled-tasks skill install
  --opencode-install-cmd=<cmd>
                         Override OpenCode install/update command
  --rtk-install-cmd=<cmd>
                         Override RTK install command
  --scheduled-tasks-daemon-cmd=<cmd>
                         Override scheduled-tasks daemon install command
  --scheduled-tasks-skill-cmd=<cmd>
                         Override scheduled-tasks skill install command

Agents commands:
  agents list [--json]       List built-in and custom JSON agents
  agents validate [--json]   Validate custom JSON agents
  agents create <name> --model=<provider/model>
                             Create a custom JSON agent definition

Doctor options:
  --json                 Print diagnostics as JSON

Available presets: ${getGeneratedPresetNames().join(', ')}

The installer generates OpenAI and OpenCode Go presets by default.
OpenAI is active unless --preset selects another generated preset.
For the full config reference, see docs/configuration.md.

Examples:
  bunx oh-my-opencode-slim install
  bunx oh-my-opencode-slim install --no-tui --skills=yes
  bunx oh-my-opencode-slim install --preset=opencode-go
  bunx oh-my-opencode-slim install --reset
  bunx oh-my-opencode-slim bootstrap --with-dcp --with-quota --with-rtk --with-scheduled-tasks
  bunx oh-my-opencode-slim agents list
  bunx oh-my-opencode-slim doctor
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'install') {
    const hasSubcommand = args[0] === 'install';
    const installArgs = parseArgs(args.slice(hasSubcommand ? 1 : 0));
    const exitCode = await install(installArgs);
    process.exit(exitCode);
  } else if (args[0] === 'bootstrap') {
    if (args[1] === '-h' || args[1] === '--help') {
      printHelp();
      process.exit(0);
    }
    const bootstrapArgs = parseBootstrapArgs(args.slice(1));
    const exitCode = await bootstrap(bootstrapArgs);
    process.exit(exitCode);
  } else if (args[0] === 'agents') {
    if (args[1] === '-h' || args[1] === '--help') {
      printAgentsCommandHelp();
      process.exit(0);
    }
    const agentsArgs = parseAgentsArgs(args.slice(1));
    const exitCode = await agents(agentsArgs);
    process.exit(exitCode);
  } else if (args[0] === 'doctor') {
    const doctorArgs = parseDoctorArgs(args.slice(1));
    const exitCode = await doctor(doctorArgs);
    process.exit(exitCode);
  } else if (args[0] === '-h' || args[0] === '--help') {
    printHelp();
    process.exit(0);
  } else {
    console.error(`Unknown command: ${args[0]}`);
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
