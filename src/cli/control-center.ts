import { createControlCenterServices } from '../control-center/services';
import {
  createDefaultViewState,
  renderControlCenterText,
} from '../control-center/tui-render';

export interface ControlCenterArgs {
  configDir?: string;
  help?: boolean;
  json?: boolean;
  tui?: boolean;
  refreshIntervalMs?: number;
}

export function parseControlCenterArgs(args: string[]): ControlCenterArgs {
  const result: ControlCenterArgs = { tui: true };
  for (const arg of args) {
    if (arg === '-h' || arg === '--help') result.help = true;
    else if (arg === '--json') result.json = true;
    else if (arg === '--no-tui') result.tui = false;
    else if (arg.startsWith('--config-dir=')) {
      result.configDir = arg.slice('--config-dir='.length);
    } else if (arg.startsWith('--refresh-interval-ms=')) {
      const value = Number(arg.slice('--refresh-interval-ms='.length));
      if (!Number.isInteger(value) || value < 500) {
        throw new Error('--refresh-interval-ms must be an integer >= 500');
      }
      result.refreshIntervalMs = value;
    } else {
      throw new Error(`Unknown control-center option: ${arg}`);
    }
  }
  if (result.json) result.tui = false;
  return result;
}

export function printControlCenterHelp(): void {
  console.log(`
oh-my-opencode-slim control-center

Usage:
  bunx oh-my-opencode-slim control-center [OPTIONS]

Options:
  --no-tui                  Print a read-only text snapshot and exit
  --json                    Print the backend snapshot as JSON and exit
  --config-dir=<path>       Read an alternate OpenCode config directory
  --refresh-interval-ms=<n> TUI refresh interval in milliseconds (default: 5000)
  -h, --help                Show this help message

The control center reads scheduled task files, task reports, scheduler health,
and recent task-run database rows. It does not delete, disable, or mutate tasks
from the monitor view.
`);
}

export async function controlCenter(args: ControlCenterArgs): Promise<number> {
  if (args.help) {
    printControlCenterHelp();
    return 0;
  }

  const services = createControlCenterServices({ configDir: args.configDir });
  if (args.json) {
    console.log(JSON.stringify(await services.snapshot(), null, 2));
    return 0;
  }
  if (args.tui === false) {
    const snapshot = await services.snapshot();
    console.log(renderControlCenterText(snapshot, createDefaultViewState()));
    return 0;
  }

  const { runControlCenterTui } = await import('../control-center/tui-app');
  await runControlCenterTui({
    configDir: args.configDir,
    refreshIntervalMs: args.refreshIntervalMs,
    services,
  });
  return 0;
}
