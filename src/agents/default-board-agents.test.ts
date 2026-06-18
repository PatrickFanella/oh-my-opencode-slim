import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { materializeDefaultBoardAgentDefinitions } from '../cli/config-io';
import { CustomAgentDefinitionSchema } from './custom-definitions';
import {
  DEFAULT_BOARD_AGENT_DEFINITIONS,
  DEFAULT_BOARD_AGENT_GROUPS,
  DEFAULT_BOARD_AGENT_NAMES,
} from './default-board-agents';
import { createAgents, getAgentConfigs } from './index';

describe('default board agents', () => {
  test('keeps the expected groups and agent names aligned', () => {
    expect(DEFAULT_BOARD_AGENT_GROUPS.map((group) => group.title)).toEqual([
      'BUILD',
      'OPS',
      'GROWTH',
      'PRODUCT',
      'MYTH',
    ]);
    expect(
      [...DEFAULT_BOARD_AGENT_GROUPS.flatMap((group) => group.names)].sort(),
    ).toEqual([...DEFAULT_BOARD_AGENT_NAMES].sort());
    expect(DEFAULT_BOARD_AGENT_NAMES).toHaveLength(26);
  });

  test('exports schema-valid custom agent definitions', () => {
    for (const definition of DEFAULT_BOARD_AGENT_DEFINITIONS) {
      expect(CustomAgentDefinitionSchema.parse(definition)).toEqual(definition);
    }

    expect(
      [
        ...DEFAULT_BOARD_AGENT_DEFINITIONS.map((definition) => definition.name),
      ].sort(),
    ).toEqual([...DEFAULT_BOARD_AGENT_NAMES].sort());
  });

  test('materialized definitions load as runtime subagents', () => {
    const previousConfigDir = process.env.OPENCODE_CONFIG_DIR;
    const previousEnable =
      process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST;
    const root = mkdtempSync(
      join(tmpdir(), 'blacktower-default-board-agents-'),
    );

    try {
      process.env.OPENCODE_CONFIG_DIR = join(root, 'opencode');
      process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST = '1';

      const result = materializeDefaultBoardAgentDefinitions();
      expect(result.success).toBe(true);
      expect(result.written).toHaveLength(26);

      const agentNames = new Set(createAgents({}).map((agent) => agent.name));
      for (const name of DEFAULT_BOARD_AGENT_NAMES) {
        expect(agentNames.has(name)).toBe(true);
      }

      const configs = getAgentConfigs({});
      expect(configs['api-forge']?.mode).toBe('subagent');
      expect(configs['backend-architect']?.hidden).toBe(true);
    } finally {
      if (previousConfigDir === undefined)
        delete process.env.OPENCODE_CONFIG_DIR;
      else process.env.OPENCODE_CONFIG_DIR = previousConfigDir;
      if (previousEnable === undefined) {
        delete process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST;
      } else {
        process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST =
          previousEnable;
      }
      rmSync(root, { recursive: true, force: true });
    }
  });
});
