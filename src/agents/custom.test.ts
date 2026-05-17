import { describe, expect, spyOn, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PluginConfig } from '../config';
import { createAgents, getAgentConfigs } from './index';

describe('custom-agent creation', () => {
  test('infers custom agents from unknown keys', () => {
    const config: PluginConfig = {
      agents: {
        explorer: { model: 'openai/gpt-5.4-mini' },
        reviewer: {
          model: 'openai/gpt-5.5',
          prompt: 'You are the custom reviewer agent.',
        },
      },
    };

    const agents = createAgents(config);
    const names = agents.map((agent) => agent.name);

    expect(names).toContain('reviewer');

    const customAgent = agents.find((agent) => agent.name === 'reviewer');
    expect(customAgent).toBeDefined();
    expect(customAgent?.config.model).toBe('openai/gpt-5.5');
    expect(customAgent?.config.prompt).toBe(
      'You are the custom reviewer agent.',
    );
  });

  test('supports prompt and orchestratorPrompt for custom agents', () => {
    const config: PluginConfig = {
      agents: {
        'test-auditor': {
          model: 'openai/gpt-5.4-mini',
          prompt: 'You are a custom subagent for auditing.',
          orchestratorPrompt:
            '@test-auditor\n- Role: Compliance audit specialist',
        },
      },
    };

    const agents = createAgents(config);
    const customAgent = agents.find((agent) => agent.name === 'test-auditor');

    expect(customAgent).toBeDefined();
    expect(customAgent?.config.prompt).toBe(
      'You are a custom subagent for auditing.',
    );

    const orchestrator = agents.find((agent) => agent.name === 'orchestrator');
    expect(orchestrator?.config.prompt).toContain(
      '@test-auditor\n- Role: Compliance audit specialist',
    );
    expect(orchestrator?.config.prompt).toContain('<Board Consultants>');
    const prompt = orchestrator?.config.prompt ?? '';
    expect(
      prompt.indexOf('@test-auditor\n- Role: Compliance audit specialist'),
    ).toBeLessThan(prompt.indexOf('</Agents>'));
  });

  test('injects board runtime section from board config', () => {
    const agents = createAgents({
      board: {
        enabled: true,
        defaultMode: 'route',
        councilEscalation: true,
        roles: {
          'backend-architect': {
            title: 'Backend Architect',
            purpose: 'API and service-boundary design',
            when: ['API contract changes'],
            outputs: ['recommendation', 'risks'],
            agent: 'backend-architect',
            priority: 80,
          },
        },
      },
      agents: {
        'backend-architect': {
          model: 'openai/gpt-5.5',
          prompt: 'You are Backend Architect.',
        },
      },
    });

    const orchestrator = agents.find((agent) => agent.name === 'orchestrator');

    expect(orchestrator?.config.prompt).toContain('<Board Runtime>');
    expect(orchestrator?.config.prompt).toContain('@backend-architect');
    expect(orchestrator?.config.prompt).toContain('API contract changes');
  });

  test('skips custom agents without a model', () => {
    const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const config: PluginConfig = {
        agents: {
          janitor: {
            prompt: 'You are Janitor.',
            orchestratorPrompt: '@janitor\n- Role: Cleanup specialist',
          },
        },
      };

      const agentDefs = createAgents(config);
      expect(
        agentDefs.find((agent) => agent.name === 'janitor'),
      ).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        "[oh-my-opencode] Custom agent 'janitor' skipped: 'model' is required",
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('does not create or inject disabled custom agents', () => {
    const config: PluginConfig = {
      disabled_agents: ['test-auditor', 'designer'],
      agents: {
        'test-auditor': {
          model: 'openai/gpt-5.4-mini',
          prompt: 'You are a disabled custom agent.',
        },
      },
    };

    const agentDefs = createAgents(config);
    const names = agentDefs.map((agent) => agent.name);
    expect(names).not.toContain('test-auditor');

    const sdkConfigs = getAgentConfigs(config);
    expect(sdkConfigs['test-auditor']).toBeUndefined();
  });

  test('rejects unsafe custom agent names', () => {
    const config: PluginConfig = {
      agents: {
        'unsafe/name': {
          model: 'openai/gpt-5.4-mini',
        },
      },
    };

    expect(() => createAgents(config)).toThrow();
  });

  test('rejects orchestratorPrompt that targets a different agent', () => {
    const config: PluginConfig = {
      agents: {
        janitor: {
          model: 'openai/gpt-5.4-mini',
          orchestratorPrompt: '@cleanup\n- Role: Cleanup specialist',
        },
      },
    };

    expect(() => createAgents(config)).toThrow(
      "Custom agent 'janitor' orchestratorPrompt must start with @janitor",
    );
  });

  test('accepts orchestratorPrompt that starts with displayName', () => {
    const config: PluginConfig = {
      agents: {
        janitor: {
          model: 'openai/gpt-5.4-mini',
          displayName: 'cleanup',
          orchestratorPrompt: '@cleanup\n- Role: Cleanup specialist',
        },
      },
    };

    const agents = createAgents(config);
    const orchestrator = agents.find((agent) => agent.name === 'orchestrator');
    expect(orchestrator?.config.prompt).toContain(
      '@cleanup\n- Role: Cleanup specialist',
    );
  });

  test('rewrites custom orchestratorPrompt target to displayName', () => {
    const config: PluginConfig = {
      agents: {
        janitor: {
          model: 'openai/gpt-5.4-mini',
          displayName: 'cleanup',
          orchestratorPrompt: '@janitor\n- Role: Cleanup specialist',
        },
      },
    };

    const agents = createAgents(config);
    const orchestrator = agents.find((agent) => agent.name === 'orchestrator');
    expect(orchestrator?.config.prompt).toContain(
      '@cleanup\n- Role: Cleanup specialist',
    );
    expect(orchestrator?.config.prompt).not.toContain(
      '@janitor\n- Role: Cleanup specialist',
    );
  });

  test('loads custom agents from JSON definition directory', () => {
    const previousConfigDir = process.env.OPENCODE_CONFIG_DIR;
    const root = mkdtempSync(join(tmpdir(), 'omoc-agent-defs-'));
    const configDir = join(root, 'opencode');
    const agentDir = join(configDir, 'oh-my-opencode-slim', 'agents');

    try {
      mkdirSync(agentDir, { recursive: true });
      process.env.OPENCODE_CONFIG_DIR = configDir;
      writeFileSync(
        join(agentDir, 'researcher.json'),
        JSON.stringify({
          name: 'researcher',
          model: 'openai/gpt-5.4-mini',
          prompt: 'You are a custom JSON researcher.',
          orchestratorPrompt:
            '@researcher\n- Role: JSON-defined research agent',
          skills: ['web-search'],
          mcps: ['websearch'],
        }),
      );

      const agents = createAgents({});
      const customAgent = agents.find((agent) => agent.name === 'researcher');
      const orchestrator = agents.find(
        (agent) => agent.name === 'orchestrator',
      );

      expect(customAgent?.config.model).toBe('openai/gpt-5.4-mini');
      expect(customAgent?.config.prompt).toBe(
        'You are a custom JSON researcher.',
      );
      expect(customAgent?.config.permission).toMatchObject({
        skill: { 'web-search': 'allow' },
      });
      expect(getAgentConfigs({}).researcher.mcps).toEqual(['websearch']);
      expect(orchestrator?.config.prompt).toContain(
        '@researcher\n- Role: JSON-defined research agent',
      );
    } finally {
      if (previousConfigDir === undefined) {
        delete process.env.OPENCODE_CONFIG_DIR;
      } else {
        process.env.OPENCODE_CONFIG_DIR = previousConfigDir;
      }
      rmSync(root, { recursive: true, force: true });
    }
  });
});
