import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import { registerCommandTemplates } from './command-registry';
import { safeReadObserveCounts } from './observe/db';

const CONFIG_DIR = join(homedir(), '.config', 'opencode');

export type PluginHealthStatus = {
  plugins: string[];
  commands: string[];
  binaries: { gh: string | null; rtk: string | null };
  states: {
    caveman: { defaultMode?: string };
    review: { autoReview?: boolean };
    observe: {
      activeCount: number;
      pendingCount: number;
      nextCheckAt: string | null;
    };
  };
};

type PluginHealthOptions = {
  directory: string;
  observeEnabled?: boolean;
  observeDbPath?: string;
  observeBaseConfigDir?: string;
};

function loadJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function listPluginFiles(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => {
        if (!entry.isFile()) return false;
        if (entry.name.startsWith('_')) return false;
        return entry.name.endsWith('.js') || entry.name.endsWith('.ts');
      })
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function listCommandFiles(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function findBinaryOnPath(name: string): string | null {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) continue;
    const fullPath = join(dir, name);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export function collectPluginHealthStatus(
  options: PluginHealthOptions,
): PluginHealthStatus {
  const caveman = loadJson(join(CONFIG_DIR, 'caveman-state.json'), {
    defaultMode: 'ultra',
  });
  const review = loadJson(join(CONFIG_DIR, 'review-tools-state.json'), {
    autoReview: false,
  });
  const observe = options.observeEnabled
    ? safeReadObserveCounts({
        directory: options.directory,
        dbPath: options.observeDbPath,
        baseConfigDir: options.observeBaseConfigDir,
      })
    : {
        activeCount: 0,
        inactiveCount: 0,
        pendingCount: 0,
        nextCheckAt: null,
        eventCount: 0,
      };

  return {
    plugins: listPluginFiles(join(CONFIG_DIR, 'plugins')),
    commands: listCommandFiles(join(CONFIG_DIR, 'commands')),
    binaries: {
      gh: findBinaryOnPath('gh'),
      rtk: findBinaryOnPath('rtk'),
    },
    states: {
      caveman,
      review,
      observe: {
        activeCount: observe.activeCount,
        pendingCount: observe.pendingCount,
        nextCheckAt: observe.nextCheckAt,
      },
    },
  };
}

export function renderPluginHealthStatus(status: PluginHealthStatus): string {
  const pluginNames =
    status.plugins.length > 0 ? status.plugins.join(', ') : 'none';
  const commandNames =
    status.commands.length > 0 ? status.commands.join(', ') : 'none';

  return [
    `Plugins: ${status.plugins.length} (${pluginNames})`,
    `Commands: ${status.commands.length} (${commandNames})`,
    `Caveman default: ${status.states.caveman.defaultMode ?? 'unknown'}`,
    `Auto-review: ${status.states.review.autoReview ? 'on' : 'off'}`,
    `Observe loops: active=${status.states.observe.activeCount} pending=${status.states.observe.pendingCount} next=${status.states.observe.nextCheckAt ?? 'none'}`,
    `gh binary: ${status.binaries.gh ?? 'missing'}`,
    `rtk binary: ${status.binaries.rtk ?? 'missing'}`,
  ].join('\n');
}

export function renderPluginHealthDoctor(status: PluginHealthStatus): string {
  const issues: string[] = [];

  if (!status.binaries.gh) {
    issues.push('gh missing. GitHub toolkit tools will fail.');
  }

  if (!status.binaries.rtk) {
    issues.push('rtk missing. RTK toolkit tools will fail.');
  }

  return issues.length > 0
    ? issues.map((issue) => `- ${issue}`).join('\n')
    : 'No obvious integrated toolkit health issues.';
}

export function createPluginHealthToolkit({
  directory,
  observeEnabled,
  observeDbPath,
  observeBaseConfigDir,
}: {
  directory: string;
  observeEnabled?: boolean;
  observeDbPath?: string;
  observeBaseConfigDir?: string;
}): {
  registerCommands: (opencodeConfig: Record<string, unknown>) => void;
  tools: Record<string, ToolDefinition>;
} {
  void directory;

  function registerCommands(opencodeConfig: Record<string, unknown>): void {
    registerCommandTemplates(opencodeConfig, {
      'plugin-status': {
        description: 'Show integrated toolkit status',
        template: 'Use the `plugin_status` tool.',
      },
      'plugin-doctor': {
        description: 'Diagnose integrated toolkit health',
        template: 'Use the `plugin_doctor` tool.',
      },
    });
  }

  return {
    registerCommands,
    tools: {
      plugin_status: tool({
        description: 'Show integrated toolkit status and key runtime state.',
        args: {},
        async execute(_args, context) {
          const status = collectPluginHealthStatus({
            directory,
            observeEnabled,
            observeDbPath,
            observeBaseConfigDir,
          });
          context.metadata({ title: 'Plugin status', metadata: status });
          return renderPluginHealthStatus(status);
        },
      }),
      plugin_doctor: tool({
        description:
          'Check integrated toolkit health, dependencies, and obvious misconfigurations.',
        args: {},
        async execute(_args, context) {
          const status = collectPluginHealthStatus({
            directory,
            observeEnabled,
            observeDbPath,
            observeBaseConfigDir,
          });
          context.metadata({ title: 'Plugin doctor', metadata: status });
          return [
            renderPluginHealthStatus(status),
            '',
            'Issues:',
            renderPluginHealthDoctor(status),
          ].join('\n');
        },
      }),
    },
  };
}
