import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startControlCenterWebServer } from '../control-center/web-api';

export interface ControlCenterWebArgs {
  allowNetwork?: boolean;
  apiOnly?: boolean;
  configDir?: string;
  help?: boolean;
  host: string;
  open?: boolean;
  port: number;
}

export function parseControlCenterWebArgs(
  args: string[],
): ControlCenterWebArgs {
  const result: ControlCenterWebArgs = {
    host: '127.0.0.1',
    port: 47671,
  };

  for (const arg of args) {
    if (arg === '-h' || arg === '--help') result.help = true;
    else if (arg === '--allow-network') result.allowNetwork = true;
    else if (arg === '--api-only') result.apiOnly = true;
    else if (arg === '--open') result.open = true;
    else if (arg.startsWith('--host=')) {
      result.host = arg.slice('--host='.length);
    } else if (arg.startsWith('--port=')) {
      const value = Number(arg.slice('--port='.length));
      if (!Number.isInteger(value) || value < 0 || value > 65_535) {
        throw new Error('--port must be an integer between 0 and 65535');
      }
      result.port = value;
    } else if (arg.startsWith('--config-dir=')) {
      result.configDir = arg.slice('--config-dir='.length);
    } else {
      throw new Error(`Unknown control-center-web option: ${arg}`);
    }
  }

  if (!result.allowNetwork && !isLoopbackHost(result.host)) {
    throw new Error(
      '--host must be a loopback address unless --allow-network is set',
    );
  }

  return result;
}

export function printControlCenterWebHelp(): void {
  console.log(`
oh-my-opencode-slim control-center-web

Usage:
  bunx oh-my-opencode-slim control-center-web [OPTIONS]

Options:
  --host=<host>        Host to bind (default: 127.0.0.1)
  --port=<port>        Port to bind, 0 for random (default: 47671)
  --config-dir=<path>  Read an alternate OpenCode config directory
  --api-only           Serve only the read-only API, no Vite static assets
  --allow-network      Permit non-loopback hosts; exposes local task metadata
  --open               Open the dashboard URL in the default browser
  -h, --help           Show this help message

The web control center is read-only. It exposes the same scheduler/task snapshot
as the terminal dashboard through localhost HTTP and SSE endpoints.
`);
}

export async function controlCenterWeb(
  args: ControlCenterWebArgs,
): Promise<number> {
  if (args.help) {
    printControlCenterWebHelp();
    return 0;
  }

  const assetRoot = args.apiOnly ? undefined : findWebAssetRoot();
  if (!args.apiOnly && !assetRoot) {
    console.warn(
      'Web assets not found. Run `bun run build:web`; starting API-only mode.',
    );
  }

  const server = startControlCenterWebServer({
    assetRoot,
    configDir: args.configDir,
    host: args.host,
    port: args.port,
  });

  console.log(`Control center web: ${server.url}`);
  console.log(`API snapshot: ${server.url}/api/snapshot`);
  console.log('Press Ctrl+C to stop.');

  if (args.open) openBrowser(server.url);

  await waitForShutdown();
  server.stop();
  return 0;
}

export function findWebAssetRoot(): string | undefined {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), 'apps/control-center-web/dist'),
    resolve(currentDir, '../../apps/control-center-web/dist'),
    resolve(currentDir, '../../../apps/control-center-web/dist'),
  ];
  return candidates.find((candidate) =>
    existsSync(join(candidate, 'index.html')),
  );
}

function isLoopbackHost(host: string): boolean {
  return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(
    host.toLowerCase(),
  );
}

function openBrowser(url: string): void {
  const commands =
    platform() === 'darwin'
      ? [['open', url]]
      : platform() === 'win32'
        ? [['cmd', '/c', 'start', '', url]]
        : [['xdg-open', url]];
  for (const [command, ...args] of commands) {
    try {
      Bun.spawn([command, ...args], { stderr: 'ignore', stdout: 'ignore' });
      return;
    } catch {
      // Try the next platform command if this one is unavailable.
    }
  }
}

function waitForShutdown(): Promise<void> {
  return new Promise((resolve) => {
    const shutdown = () => {
      process.off('SIGINT', shutdown);
      process.off('SIGTERM', shutdown);
      resolve();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
}
