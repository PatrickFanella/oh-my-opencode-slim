#!/usr/bin/env bun

/**
 * Generates a JSON Schema from the Zod PluginConfigSchema.
 * Run as part of the build step so the schema stays in sync with the source.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { CustomAgentDefinitionSchema } from '../src/agents/custom-definitions';
import { PluginConfigSchema } from '../src/config/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'oh-my-opencode-slim.schema.json');
const customAgentOutputPath = join(rootDir, 'custom-agent.schema.json');

const schema = z.toJSONSchema(PluginConfigSchema, {
  // Use 'input' so defaulted fields are optional in the schema,
  // matching how users actually write their config files
  io: 'input',
});

const jsonSchema = {
  ...schema,
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'oh-my-opencode-slim',
  description:
    'Configuration schema for oh-my-opencode-slim plugin for OpenCode',
};

function stringifySchema(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /"required": \[\n((?:\s+"[^"]+",?\n)+)\s+\]/g,
    (_match, entries: string) => {
      const names = entries
        .trim()
        .split(/,?\n/)
        .map((entry) => entry.trim().replace(/,$/, ''));
      return `"required": [${names.join(', ')}]`;
    },
  );
}

const json = stringifySchema(jsonSchema);
writeFileSync(outputPath, `${json}\n`);

console.log(`✅ Schema written to ${outputPath}`);

const customAgentSchema = z.toJSONSchema(CustomAgentDefinitionSchema, {
  io: 'input',
});
const customAgentJsonSchema = {
  ...customAgentSchema,
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'oh-my-opencode-slim custom agent definition',
  description:
    'Schema for JSON custom agents loaded from oh-my-opencode-slim/agents/*.json',
};

writeFileSync(
  customAgentOutputPath,
  `${stringifySchema(customAgentJsonSchema)}\n`,
);
console.log(`✅ Custom agent schema written to ${customAgentOutputPath}`);
