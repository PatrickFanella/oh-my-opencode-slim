import { describe, expect, test } from 'bun:test';
import { ALL_AGENT_NAMES } from '../config/constants';
import {
  BUILTIN_AGENT_MANIFESTS,
  getDefaultAgentMcpMap,
  getDefaultAgentSkillMap,
  getDefaultDisabledAgents,
  getDefaultModelMap,
  getOrchestratorAgentPrompts,
  getProtectedAgentNames,
} from './registry';

describe('agent registry', () => {
  test('has one manifest for every core agent', () => {
    const names = BUILTIN_AGENT_MANIFESTS.map((manifest) => manifest.name);

    expect(names.sort()).toEqual([...ALL_AGENT_NAMES].sort());
  });

  test('centralizes model, skill, mcp, and disable defaults', () => {
    expect(getDefaultModelMap().oracle).toBe('openai/gpt-5.5');
    expect(getDefaultAgentSkillMap().fixer).toContain('tdd');
    expect(getDefaultAgentMcpMap().librarian).toEqual([
      'websearch',
      'context7',
      'grep_app',
    ]);
    expect(getDefaultDisabledAgents()).toEqual(['observer']);
  });

  test('keeps protected and orchestrator-routing metadata in registry', () => {
    expect(getProtectedAgentNames().sort()).toEqual(
      ['councillor', 'orchestrator'].sort(),
    );
    expect(getOrchestratorAgentPrompts().explorer).toContain('@explorer');
    expect(getOrchestratorAgentPrompts().councillor).toBeUndefined();
  });
});
