import { z } from 'zod';
import council from './definitions/council.json';
import councillor from './definitions/councillor.json';
import designer from './definitions/designer.json';
import explorer from './definitions/explorer.json';
import fixer from './definitions/fixer.json';
import librarian from './definitions/librarian.json';
import observer from './definitions/observer.json';
import oracle from './definitions/oracle.json';
import orchestrator from './definitions/orchestrator.json';

const AgentDefinitionManifestSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .regex(/^[a-z][a-z0-9_-]*$/i),
    kind: z.enum(['built-in', 'internal']).default('built-in'),
    protected: z.boolean().default(false),
    enabledByDefault: z.boolean().default(true),
    mode: z.enum(['primary', 'subagent', 'all']).default('subagent'),
    description: z.string().min(1),
    defaultModel: z.string().min(1).nullable(),
    temperature: z.number().min(0).max(2).default(0.2),
    skills: z.array(z.string()).default([]),
    mcps: z.array(z.string()).default([]),
    orchestratorPrompt: z.string().min(1).optional(),
  })
  .strict();

export type AgentDefinitionManifest = z.infer<
  typeof AgentDefinitionManifestSchema
>;

const RAW_BUILTIN_MANIFESTS = [
  orchestrator,
  explorer,
  librarian,
  oracle,
  designer,
  fixer,
  observer,
  council,
  councillor,
];

export const BUILTIN_AGENT_MANIFESTS: AgentDefinitionManifest[] =
  RAW_BUILTIN_MANIFESTS.map((manifest) =>
    AgentDefinitionManifestSchema.parse(manifest),
  );

const BUILTIN_AGENT_MANIFEST_BY_NAME = new Map(
  BUILTIN_AGENT_MANIFESTS.map((manifest) => [manifest.name, manifest]),
);

export function getBuiltinAgentManifest(
  agentName: string,
): AgentDefinitionManifest | undefined {
  return BUILTIN_AGENT_MANIFEST_BY_NAME.get(agentName);
}

export function getDefaultModelMap(): Record<string, string | undefined> {
  return Object.fromEntries(
    BUILTIN_AGENT_MANIFESTS.map((manifest) => [
      manifest.name,
      manifest.defaultModel ?? undefined,
    ]),
  );
}

export function getDefaultAgentMcpMap(): Record<string, string[]> {
  return Object.fromEntries(
    BUILTIN_AGENT_MANIFESTS.map((manifest) => [manifest.name, manifest.mcps]),
  );
}

export function getDefaultAgentSkillMap(): Record<string, readonly string[]> {
  return Object.fromEntries(
    BUILTIN_AGENT_MANIFESTS.map((manifest) => [manifest.name, manifest.skills]),
  );
}

export function getDefaultDisabledAgents(): string[] {
  return BUILTIN_AGENT_MANIFESTS.filter(
    (manifest) => !manifest.enabledByDefault,
  ).map((manifest) => manifest.name);
}

export function getProtectedAgentNames(): string[] {
  return BUILTIN_AGENT_MANIFESTS.filter((manifest) => manifest.protected).map(
    (manifest) => manifest.name,
  );
}

export function getOrchestratorAgentPrompts(): Record<string, string> {
  return Object.fromEntries(
    BUILTIN_AGENT_MANIFESTS.flatMap((manifest) =>
      manifest.orchestratorPrompt
        ? [[manifest.name, manifest.orchestratorPrompt] as const]
        : [],
    ),
  );
}
