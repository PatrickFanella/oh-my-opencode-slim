import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import {
  getAgentDefinitionDirs,
  listCustomAgentDefinitionFiles,
} from '../agents/custom-definitions';
import { BUILTIN_AGENT_MANIFESTS } from '../agents/registry';

type AgentsCommand = 'list' | 'validate' | 'create';

export interface AgentsArgs {
  command: AgentsCommand;
  json?: boolean;
  name?: string;
  model?: string;
  prompt?: string;
  orchestratorPrompt?: string;
  skills?: string[];
  mcps?: string[];
  temperature?: number;
  force?: boolean;
  dryRun?: boolean;
}

const CUSTOM_AGENT_SCHEMA_URL =
  'https://unpkg.com/oh-my-opencode-slim@latest/custom-agent.schema.json';

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseValueArg(arg: string, key: string): string | undefined {
  const prefix = `--${key}=`;
  return arg.startsWith(prefix) ? arg.slice(prefix.length) : undefined;
}

export function parseAgentsArgs(args: string[]): AgentsArgs {
  const command = args[0] as AgentsCommand | undefined;
  if (!command || !['list', 'validate', 'create'].includes(command)) {
    throw new Error(`Unknown agents command: ${command ?? ''}`.trim());
  }

  const result: AgentsArgs = { command };
  const rest = args.slice(1);

  if (command === 'create') {
    const name = rest.find((arg) => !arg.startsWith('-'));
    if (name) result.name = name;
  }

  for (const arg of rest) {
    if (arg === result.name) continue;
    if (arg === '--json') result.json = true;
    else if (arg === '--force') result.force = true;
    else if (arg === '--dry-run') result.dryRun = true;
    else if (parseValueArg(arg, 'model'))
      result.model = parseValueArg(arg, 'model');
    else if (parseValueArg(arg, 'prompt')) {
      result.prompt = parseValueArg(arg, 'prompt');
    } else if (parseValueArg(arg, 'orchestrator-prompt')) {
      result.orchestratorPrompt = parseValueArg(arg, 'orchestrator-prompt');
    } else if (parseValueArg(arg, 'skills')) {
      result.skills = splitList(parseValueArg(arg, 'skills') ?? '');
    } else if (parseValueArg(arg, 'mcps')) {
      result.mcps = splitList(parseValueArg(arg, 'mcps') ?? '');
    } else if (parseValueArg(arg, 'temperature')) {
      result.temperature = Number(parseValueArg(arg, 'temperature'));
    } else if (!arg.startsWith('-')) {
    } else {
      throw new Error(`Unknown agents option: ${arg}`);
    }
  }

  return result;
}

function printAgentsHelp(): void {
  console.log(`
oh-my-opencode-slim agents

Usage:
  bunx oh-my-opencode-slim agents list [--json]
  bunx oh-my-opencode-slim agents validate [--json]
  bunx oh-my-opencode-slim agents create <name> --model=<provider/model> [OPTIONS]

Create options:
  --prompt=<text>                 Full custom agent prompt
  --orchestrator-prompt=<text>    Compact @agent routing block
  --skills=a,b                    Skill names to allow
  --mcps=a,b                      MCP names to attach
  --temperature=<number>          Model temperature, 0-2
  --force                         Overwrite existing file
  --dry-run                       Print file that would be written
`);
}

function getCreateTargetPath(name: string): string {
  return join(getAgentDefinitionDirs()[0], `${name}.json`);
}

function buildAgentDefinition(args: AgentsArgs): Record<string, unknown> {
  if (!args.name) throw new Error('agents create requires <name>');
  if (!/^[a-z][a-z0-9_-]*$/i.test(args.name)) {
    throw new Error('Agent name must match /^[a-z][a-z0-9_-]*$/i');
  }
  if (!args.model)
    throw new Error('agents create requires --model=<provider/model>');
  if (!/^[^/\s]+\/[^\s]+$/.test(args.model)) {
    throw new Error('Model must use provider/model format');
  }

  const title = args.name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    $schema: CUSTOM_AGENT_SCHEMA_URL,
    name: args.name,
    model: args.model,
    ...(args.temperature !== undefined
      ? { temperature: args.temperature }
      : {}),
    prompt: args.prompt ?? `You are ${title}.`,
    orchestratorPrompt:
      args.orchestratorPrompt ??
      `@${args.name}\n- Role: ${title}\n- Delegate when: this specialist is explicitly useful\n- Don't delegate when: a core agent is a better fit`,
    skills: args.skills ?? [],
    mcps: args.mcps ?? [],
  };
}

async function listAgents(args: AgentsArgs): Promise<number> {
  const customFiles = listCustomAgentDefinitionFiles();
  const payload = {
    builtIn: BUILTIN_AGENT_MANIFESTS.map((manifest) => ({
      name: manifest.name,
      kind: manifest.kind,
      enabledByDefault: manifest.enabledByDefault,
      protected: manifest.protected,
    })),
    custom: customFiles.map((file) => ({
      name: file.definition?.name ?? basename(file.path, '.json'),
      path: file.path,
      valid: file.valid,
      error: file.error,
    })),
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return 0;
  }

  console.log('Built-in agents:');
  for (const agent of payload.builtIn) {
    console.log(`  - ${agent.name}${agent.protected ? ' (protected)' : ''}`);
  }
  console.log('\nCustom agents:');
  if (payload.custom.length === 0) {
    console.log('  none');
  } else {
    for (const agent of payload.custom) {
      console.log(
        `  - ${agent.name} ${agent.valid ? '[ok]' : '[invalid]'} ${agent.path}`,
      );
    }
  }

  return 0;
}

async function validateAgents(args: AgentsArgs): Promise<number> {
  const customFiles = listCustomAgentDefinitionFiles();
  const invalid = customFiles.filter((file) => !file.valid);

  if (args.json) {
    console.log(
      JSON.stringify(
        { valid: invalid.length === 0, files: customFiles },
        null,
        2,
      ),
    );
    return invalid.length === 0 ? 0 : 1;
  }

  if (customFiles.length === 0) {
    console.log('No custom agent definitions found.');
    return 0;
  }

  for (const file of customFiles) {
    console.log(`${file.valid ? '[ok]' : '[x]'} ${file.path}`);
    if (file.error) console.log(`  ${file.error}`);
  }

  return invalid.length === 0 ? 0 : 1;
}

async function createAgent(args: AgentsArgs): Promise<number> {
  const definition = buildAgentDefinition(args);
  const targetPath = getCreateTargetPath(args.name ?? '');
  const content = `${JSON.stringify(definition, null, 2)}\n`;

  if (args.dryRun) {
    console.log(content);
    return 0;
  }

  if (existsSync(targetPath) && !args.force) {
    console.error(`Agent definition already exists: ${targetPath}`);
    console.error('Use --force to overwrite.');
    return 1;
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content);
  console.log(`Created ${targetPath}`);
  console.log('Restart OpenCode to load the agent.');
  return 0;
}

export async function agents(args: AgentsArgs): Promise<number> {
  if (args.command === 'list') return listAgents(args);
  if (args.command === 'validate') return validateAgents(args);
  if (args.command === 'create') return createAgent(args);
  printAgentsHelp();
  return 1;
}

export function printAgentsCommandHelp(): void {
  printAgentsHelp();
}
