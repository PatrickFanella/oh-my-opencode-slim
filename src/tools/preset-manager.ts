import type { PluginInput } from '@opencode-ai/plugin';
import type { ModelEntry, PluginConfig, Preset } from '../config';
import {
  buildRuntimePresetSwitchPlan,
  commitRuntimePresetSwitch,
  getRuntimePresetState,
  rollbackRuntimePresetSwitch,
  syncRuntimePresetFromConfig,
} from '../config/runtime-preset-switching';
import { readTuiSnapshot, recordTuiAgentModels } from '../tui-state';
import { createInternalAgentTextPart } from '../utils';

const COMMAND_NAME = 'preset';

/**
 * Creates a preset manager for the /preset slash command.
 *
 * Uses the OpenCode SDK's client.config.update() to change agent models
 * and temperatures without restarting. The server invalidates its agent
 * cache and re-reads config on the next prompt.
 *
 * Note: activePreset is tracked in-memory only and resets on plugin reload.
 * If the user manually edits config or another mechanism changes agents,
 * this tracker may become stale until the next /preset call.
 */
export function createPresetManager(ctx: PluginInput, config: PluginConfig) {
  // Sync from module-level state in case of plugin re-init — the runtime
  // preset persists across dispose()/re-init cycles.
  syncRuntimePresetFromConfig(config);
  let activePreset: string | null = getRuntimePresetState(config);

  /**
   * Handle the /preset command from command.execute.before hook.
   *
   * - No arguments: list available presets
   * - With argument: switch to the named preset
   */
  async function handleCommandExecuteBefore(
    input: {
      command: string;
      sessionID: string;
      arguments: string;
    },
    output: { parts: Array<{ type: string; text?: string }> },
  ): Promise<void> {
    if (input.command !== COMMAND_NAME) {
      return;
    }

    // Clear the template so OpenCode doesn't send it to the LLM
    output.parts.length = 0;

    const arg = input.arguments.trim();
    const presets = config.presets ?? {};

    if (!arg) {
      // List available presets
      output.parts.push(createInternalAgentTextPart(formatPresetList(presets)));
      return;
    }

    // Guard against multi-word arguments
    if (/\s/.test(arg)) {
      const suggestion = arg.split(/\s+/)[0];
      output.parts.push(
        createInternalAgentTextPart(
          `Preset names cannot contain spaces. Did you mean: /preset ${suggestion}?`,
        ),
      );
      return;
    }

    // Switch to named preset
    await switchPreset(arg, output);
  }

  /**
   * Register the /preset command in the OpenCode config.
   */
  function registerCommand(opencodeConfig: Record<string, unknown>): void {
    const configCommand = opencodeConfig.command as
      | Record<string, unknown>
      | undefined;
    if (!configCommand?.[COMMAND_NAME]) {
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      (opencodeConfig.command as Record<string, unknown>)[COMMAND_NAME] = {
        template: 'List available presets and switch between them',
        description:
          'Switch agent presets at runtime (e.g., /preset cheap, /preset powerful)',
      };
    }
  }

  /**
   * Switch to the given preset name by calling client.config.update().
   */
  async function switchPreset(
    presetName: string,
    output: { parts: Array<{ type: string; text?: string }> },
  ): Promise<void> {
    const plan = buildRuntimePresetSwitchPlan(config, presetName);
    if ('error' in plan) {
      output.parts.push(createInternalAgentTextPart(plan.error));
      return;
    }

    const agentUpdates = plan.presetUpdates;
    const allUpdates = plan.updates;

    const previousPreset = activePreset;
    commitRuntimePresetSwitch(presetName);

    try {
      await ctx.client.config.update({
        body: { agent: allUpdates },
      });

      const snapshot = readTuiSnapshot();
      const agentModels = { ...snapshot.agentModels };
      for (const [agentName, agentConfig] of Object.entries(allUpdates)) {
        if (typeof agentConfig.model === 'string') {
          agentModels[agentName] = agentConfig.model;
        }
      }
      recordTuiAgentModels({ agentModels });

      activePreset = presetName;

      const summaryParts: string[] = [];
      for (const [name, cfg] of Object.entries(agentUpdates)) {
        const parts: string[] = [name];
        if (cfg.model) parts.push(`model: ${cfg.model}`);
        if (cfg.variant) parts.push(`variant: ${cfg.variant}`);
        if (cfg.temperature !== undefined)
          parts.push(`temp: ${cfg.temperature}`);
        if (cfg.options) parts.push('options: yes');
        summaryParts.push(parts.join(' → '));
      }
      if (plan.resetAgentNames.length > 0) {
        summaryParts.push(
          `Reset to baseline: ${plan.resetAgentNames.join(', ')}`,
        );
      }
      output.parts.push(
        createInternalAgentTextPart(
          `Switched to preset "${presetName}":\n${summaryParts.join('\n')}`,
        ),
      );
    } catch (err) {
      rollbackRuntimePresetSwitch(previousPreset);
      output.parts.push(
        createInternalAgentTextPart(
          `Failed to switch preset "${presetName}": ${String(err)}`,
        ),
      );
    }
  }

  /**
   * Format the list of available presets with the active one highlighted.
   */
  function formatPresetList(presets: Record<string, Preset>): string {
    const names = Object.keys(presets);
    if (names.length === 0) {
      return 'No presets configured. Define presets in blacktower.jsonc under the "presets" field.';
    }

    const lines = ['Available presets:'];
    for (const name of names) {
      const marker = name === activePreset ? ' ← active' : '';
      const preset = presets[name];
      const agentNames = Object.keys(preset);
      const models = agentNames
        .map((a) => {
          const cfg = preset[a];
          const modelStr =
            typeof cfg.model === 'string'
              ? cfg.model
              : Array.isArray(cfg.model) && cfg.model.length > 0
                ? resolveFirstModel(cfg.model)
                : undefined;
          return modelStr ? `    ${a} → ${modelStr}` : `    ${a}`;
        })
        .join('\n');
      lines.push(`  ${name}${marker}`);
      lines.push(models);
    }
    lines.push('\nUsage: /preset <name> to switch.');

    return lines.join('\n');
  }

  /**
   * Resolve the first model from an array-form model entry.
   */
  function resolveFirstModel(
    models: Array<string | ModelEntry>,
  ): string | undefined {
    if (models.length === 0) return undefined;
    const first = models[0];
    return typeof first === 'string' ? first : first.id;
  }

  return {
    handleCommandExecuteBefore,
    registerCommand,
  };
}

export type PresetManager = ReturnType<typeof createPresetManager>;
