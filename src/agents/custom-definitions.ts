import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { getConfigSearchDirs } from '../cli/paths';
import type { AgentOverrideConfig, PluginConfig } from '../config/schema';

export const CustomAgentDefinitionSchema = z
  .object({
    $schema: z.string().optional(),
    name: z
      .string()
      .min(1)
      .regex(/^[a-z][a-z0-9_-]*$/i),
    model: z
      .union([
        z.string(),
        z
          .array(
            z.union([
              z.string(),
              z.object({ id: z.string(), variant: z.string().optional() }),
            ]),
          )
          .min(1),
      ])
      .optional(),
    temperature: z.number().min(0).max(2).optional(),
    variant: z.string().optional(),
    skills: z.array(z.string()).optional(),
    mcps: z.array(z.string()).optional(),
    prompt: z.string().min(1).optional(),
    orchestratorPrompt: z.string().min(1).optional(),
    options: z.record(z.string(), z.unknown()).optional(),
    displayName: z.string().min(1).optional(),
  })
  .strict();

export type CustomAgentDefinition = z.infer<typeof CustomAgentDefinitionSchema>;

export interface CustomAgentDefinitionFile {
  path: string;
  fileName: string;
  valid: boolean;
  definition?: CustomAgentDefinition;
  error?: string;
}

export function getAgentDefinitionDirs(): string[] {
  if (
    process.env.NODE_ENV === 'test' &&
    process.env.OPENCODE_ENABLE_CUSTOM_AGENT_DEFINITIONS_IN_TEST !== '1'
  ) {
    return [];
  }

  return getConfigSearchDirs().map((configDir) =>
    join(configDir, 'oh-my-opencode-slim', 'agents'),
  );
}

export function readCustomAgentDefinitionFile(
  path: string,
  fileName = path,
): CustomAgentDefinitionFile {
  try {
    return {
      path,
      fileName,
      valid: true,
      definition: CustomAgentDefinitionSchema.parse(
        JSON.parse(readFileSync(path, 'utf-8')),
      ),
    };
  } catch (error) {
    return {
      path,
      fileName,
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function listCustomAgentDefinitionFiles(): CustomAgentDefinitionFile[] {
  return getAgentDefinitionDirs().flatMap((dir) => {
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
      .filter((entry) => entry.endsWith('.json'))
      .map((entry) => readCustomAgentDefinitionFile(join(dir, entry), entry));
  });
}

function readAgentDefinitionsFromDir(
  dir: string,
): Record<string, AgentOverrideConfig> {
  if (!existsSync(dir)) return {};

  const definitions: Record<string, AgentOverrideConfig> = {};
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.json')) continue;

    const path = join(dir, entry);
    try {
      const parsed = CustomAgentDefinitionSchema.parse(
        JSON.parse(readFileSync(path, 'utf-8')),
      );
      const { $schema: _schema, name, ...override } = parsed;
      definitions[name] = override;
    } catch (error) {
      console.warn(
        `[oh-my-opencode-slim] Skipping invalid agent definition ${path}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return definitions;
}

export function loadCustomAgentDefinitionOverrides(): Record<
  string,
  AgentOverrideConfig
> {
  return Object.assign(
    {},
    ...getAgentDefinitionDirs()
      .slice()
      .reverse()
      .map(readAgentDefinitionsFromDir),
  );
}

export function mergeCustomAgentDefinitions(
  config?: PluginConfig,
): PluginConfig | undefined {
  const definitions = loadCustomAgentDefinitionOverrides();
  if (Object.keys(definitions).length === 0) return config;

  return {
    ...(config ?? {}),
    agents: {
      ...definitions,
      ...(config?.agents ?? {}),
    },
  };
}
