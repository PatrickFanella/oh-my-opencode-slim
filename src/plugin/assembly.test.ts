import { describe, expect, test } from 'bun:test';
import type { AgentOverrideConfig, Preset } from '../config';
import {
  applyRuntimePresetScalarField,
  ensureManagedSkillsPath,
  getPresetOverrideForResolvedAgent,
  omitGeneratedPermission,
  shouldInheritGlobalPermission,
} from './assembly';

describe('ensureManagedSkillsPath', () => {
  test('adds the managed skills path while preserving existing string paths', () => {
    const config: Record<string, unknown> = {
      skills: { paths: ['existing', 123, 'managed'] },
    };

    ensureManagedSkillsPath(config, 'managed');

    expect(config.skills).toEqual({ paths: ['existing', 'managed'] });
  });

  test('creates skills config when missing', () => {
    const config: Record<string, unknown> = {};

    ensureManagedSkillsPath(config, 'managed');

    expect(config.skills).toEqual({ paths: ['managed'] });
  });
});

describe('global permission inheritance', () => {
  test('detects global permission allow shorthand', () => {
    expect(shouldInheritGlobalPermission({ permission: 'allow' })).toBe(true);
    expect(shouldInheritGlobalPermission({ permission: 'ask' })).toBe(false);
    expect(
      shouldInheritGlobalPermission({ permission: { bash: 'allow' } }),
    ).toBe(false);
  });

  test('omits generated permission while preserving other agent fields', () => {
    expect(
      omitGeneratedPermission({
        model: 'test/model',
        permission: { bash: 'deny' },
        description: 'Test agent',
      }),
    ).toEqual({
      model: 'test/model',
      description: 'Test agent',
    });
  });
});

describe('getPresetOverrideForResolvedAgent', () => {
  test('resolves overrides through agent aliases', () => {
    const preset = {
      explore: { model: 'anthropic/claude-sonnet-4-5' },
    } satisfies Preset;

    expect(getPresetOverrideForResolvedAgent(preset, 'explorer')).toEqual({
      model: 'anthropic/claude-sonnet-4-5',
    });
  });

  test('returns undefined when no resolved agent matches', () => {
    const preset = {
      oracle: { model: 'anthropic/claude-opus-4-5' },
    } satisfies Preset;

    expect(getPresetOverrideForResolvedAgent(preset, 'fixer')).toBeUndefined();
  });
});

describe('applyRuntimePresetScalarField', () => {
  test('writes scalar value from the active override', () => {
    const entry: Record<string, unknown> = {};

    applyRuntimePresetScalarField(
      entry,
      { variant: 'fast' },
      undefined,
      undefined,
      'variant',
      'string',
    );

    expect(entry).toEqual({ variant: 'fast' });
  });

  test('restores stale scalar value from baseline', () => {
    const entry: Record<string, unknown> = { temperature: 0.9 };
    const previousOverride: AgentOverrideConfig = { temperature: 0.9 };
    const baseline: AgentOverrideConfig = { temperature: 0.2 };

    applyRuntimePresetScalarField(
      entry,
      {},
      previousOverride,
      baseline,
      'temperature',
      'number',
    );

    expect(entry).toEqual({ temperature: 0.2 });
  });

  test('deletes stale scalar value when baseline has no matching field', () => {
    const entry: Record<string, unknown> = { variant: 'stale' };
    const previousOverride: AgentOverrideConfig = { variant: 'stale' };

    applyRuntimePresetScalarField(
      entry,
      {},
      previousOverride,
      undefined,
      'variant',
      'string',
    );

    expect(entry).toEqual({});
  });
});
