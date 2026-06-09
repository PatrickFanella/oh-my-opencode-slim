import { describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { agents, parseAgentsArgs } from './agents';

async function withTempConfig<T>(
  fn: (configDir: string) => Promise<T>,
): Promise<T> {
  const previous = process.env.OPENCODE_CONFIG_DIR;
  const previousXdg = process.env.XDG_CONFIG_HOME;
  const previousEnable =
    process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST;
  const root = mkdtempSync(join(tmpdir(), 'blacktower-agents-cli-'));
  const configDir = join(root, 'opencode');

  try {
    process.env.OPENCODE_CONFIG_DIR = configDir;
    process.env.XDG_CONFIG_HOME = join(root, 'xdg');
    process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST = '1';
    return await fn(configDir);
  } finally {
    if (previous === undefined) delete process.env.OPENCODE_CONFIG_DIR;
    else process.env.OPENCODE_CONFIG_DIR = previous;
    if (previousXdg === undefined) delete process.env.XDG_CONFIG_HOME;
    else process.env.XDG_CONFIG_HOME = previousXdg;
    if (previousEnable === undefined) {
      delete process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST;
    } else {
      process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST =
        previousEnable;
    }
    rmSync(root, { recursive: true, force: true });
  }
}

describe('agents CLI', () => {
  test('parseAgentsArgs parses create flags', () => {
    expect(
      parseAgentsArgs([
        'create',
        'weird-expert',
        '--model=openai/gpt-5.4-mini',
        '--prompt=You are Weird Expert.',
        '--orchestrator-prompt=@weird-expert\n- Role: Weird expert',
        '--skills=web-search,fact-check',
        '--mcps=websearch,grep_app',
        '--temperature=0.4',
        '--force',
        '--dry-run',
      ]),
    ).toEqual({
      command: 'create',
      name: 'weird-expert',
      model: 'openai/gpt-5.4-mini',
      prompt: 'You are Weird Expert.',
      orchestratorPrompt: '@weird-expert\n- Role: Weird expert',
      skills: ['web-search', 'fact-check'],
      mcps: ['websearch', 'grep_app'],
      temperature: 0.4,
      force: true,
      dryRun: true,
    });
  });

  test('agents create writes schema-backed custom agent JSON', async () => {
    await withTempConfig(async (configDir) => {
      const exitCode = await agents(
        parseAgentsArgs([
          'create',
          'weird-expert',
          '--model=openai/gpt-5.4-mini',
          '--skills=web-search',
          '--mcps=websearch',
        ]),
      );

      const path = join(configDir, 'blacktower', 'agents', 'weird-expert.json');
      const json = JSON.parse(readFileSync(path, 'utf-8'));

      expect(exitCode).toBe(0);
      expect(existsSync(path)).toBe(true);
      expect(json.$schema).toContain('custom-agent.schema.json');
      expect(json.name).toBe('weird-expert');
      expect(json.skills).toEqual(['web-search']);
      expect(json.mcps).toEqual(['websearch']);
    });
  });

  test('agents validate returns non-zero for invalid JSON definitions', async () => {
    await withTempConfig(async (configDir) => {
      const agentDir = join(configDir, 'blacktower', 'agents');
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(join(agentDir, 'bad.json'), '{ bad');

      const exitCode = await agents(parseAgentsArgs(['validate']));

      expect(exitCode).toBe(1);
    });
  });

  test('agents validate rejects missing model', async () => {
    await withTempConfig(async (configDir) => {
      const agentDir = join(configDir, 'blacktower', 'agents');
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(
        join(agentDir, 'missing-model.json'),
        JSON.stringify({ name: 'missing-model' }),
      );

      const exitCode = await agents(parseAgentsArgs(['validate']));

      expect(exitCode).toBe(1);
    });
  });

  test('agents validate rejects built-in agent names', async () => {
    await withTempConfig(async (configDir) => {
      const agentDir = join(configDir, 'blacktower', 'agents');
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(
        join(agentDir, 'oracle.json'),
        JSON.stringify({ name: 'oracle', model: 'openai/gpt-5.4-mini' }),
      );

      const exitCode = await agents(parseAgentsArgs(['validate']));

      expect(exitCode).toBe(1);
    });
  });

  test('agents validate catches runtime orchestratorPrompt errors', async () => {
    await withTempConfig(async (configDir) => {
      const agentDir = join(configDir, 'blacktower', 'agents');
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(
        join(agentDir, 'janitor.json'),
        JSON.stringify({
          name: 'janitor',
          model: 'openai/gpt-5.4-mini',
          orchestratorPrompt: '@cleanup\n- Role: Wrong target',
        }),
      );

      const exitCode = await agents(parseAgentsArgs(['validate']));

      expect(exitCode).toBe(1);
    });
  });

  test('agents create rejects invalid temperatures', async () => {
    await withTempConfig(async () => {
      const exitCode = await agents(
        parseAgentsArgs([
          'create',
          'hot-agent',
          '--model=openai/gpt-5.4-mini',
          '--temperature=9',
        ]),
      );

      expect(exitCode).toBe(1);
    });
  });
});
