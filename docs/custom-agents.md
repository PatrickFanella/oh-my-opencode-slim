# Custom Agent Cookbook

Create extra OMOC agents with JSON files. They load at OpenCode startup and act
like normal subagents.

## Location

Put files here:

```text
~/.config/opencode/oh-my-opencode-slim/agents/<agent-name>.json
```

Restart OpenCode after creating or changing files. Running sessions keep the old
agent registry.

## Schema

Each file can reference the generated schema:

```json
{
  "$schema": "https://unpkg.com/oh-my-opencode-slim@latest/custom-agent.schema.json",
  "name": "researcher",
  "model": "openai/gpt-5.4-mini",
  "temperature": 0.2,
  "prompt": "You are Researcher. Find evidence and cite sources.",
  "orchestratorPrompt": "@researcher\n- Role: Evidence-first research specialist\n- Delegate when: claims need external validation\n- Don't delegate when: local code search is enough",
  "skills": ["web-search", "fact-check"],
  "mcps": ["websearch"]
}
```

Fields:

| Field | Required | Meaning |
|---|---:|---|
| `$schema` | no | Editor/schema hint for this file |
| `name` | yes | Agent id. Use lowercase letters, numbers, `_`, `-`; start with a letter |
| `model` | yes | Model id in `provider/model` format, or a fallback array |
| `variant` | no | Provider/model variant |
| `temperature` | no | Number from `0` to `2` |
| `prompt` | no | Full subagent system prompt |
| `orchestratorPrompt` | no | Compact routing block injected into Orchestrator |
| `skills` | no | Skill names this agent may use |
| `mcps` | no | MCP names attached to this agent |
| `options` | no | Provider-specific options |
| `displayName` | no | Public alias used in Orchestrator prompt |

Main `oh-my-opencode-slim.json` `agents.<name>` entries override JSON files
with the same name.

## CLI

List agents:

```bash
bunx oh-my-opencode-slim agents list
```

Validate custom JSON files:

```bash
bunx oh-my-opencode-slim agents validate
```

Create a starter agent:

```bash
bunx oh-my-opencode-slim agents create researcher \
  --model=openai/gpt-5.4-mini \
  --skills=web-search,fact-check \
  --mcps=websearch
```

Use `--force` to overwrite and `--dry-run` to print the JSON without writing.

## Recipes

### Market Archaeologist

Use for positioning, competitor research, SEO gaps, and customer language.

```json
{
  "$schema": "https://unpkg.com/oh-my-opencode-slim@latest/custom-agent.schema.json",
  "name": "market-archaeologist",
  "model": "openai/gpt-5.5",
  "temperature": 0.3,
  "prompt": "You are Market Archaeologist. Find evidence-backed positioning gaps across competitors, docs, SEO surfaces, GitHub issues, and customer language.",
  "orchestratorPrompt": "@market-archaeologist\n- Role: Product positioning and competitor-forensics expert\n- Delegate when: market research, competitor comparison, SEO/content positioning, README/product narrative, customer language mining\n- Output: evidence, positioning gaps, copy angles, and next experiments",
  "skills": [
    "competitive-landscape",
    "competitor-profiling",
    "customer-research",
    "content-strategy",
    "seo-pro",
    "fact-check"
  ],
  "mcps": ["websearch", "grep_app"]
}
```

### Failure Anthropologist

Use for unclear failures, flaky tests, incidents, and prevention analysis.

```json
{
  "$schema": "https://unpkg.com/oh-my-opencode-slim@latest/custom-agent.schema.json",
  "name": "failure-anthropologist",
  "model": "openai/gpt-5.5",
  "temperature": 0.1,
  "prompt": "You are Failure Anthropologist. Analyze failures as systems: code paths, assumptions, coupling, telemetry gaps, ownership, and prevention work.",
  "orchestratorPrompt": "@failure-anthropologist\n- Role: Socio-technical failure investigator\n- Delegate when: root cause unclear, failures recur, logs/traces/errors need interpretation, ownership or prevention matters\n- Output: root-cause hypothesis, evidence map, missing signals, containment, prevention",
  "skills": [
    "systematic-debugging",
    "triage",
    "distributed-tracing",
    "slo-implementation",
    "review-quality"
  ],
  "mcps": ["websearch", "grep_app"]
}
```

### Mythic Interface Director

Use for brand-lore UX, landing pages, TUI presentation, and conversion polish.

```json
{
  "$schema": "https://unpkg.com/oh-my-opencode-slim@latest/custom-agent.schema.json",
  "name": "mythic-interface-director",
  "model": "openai/gpt-5.5",
  "temperature": 0.7,
  "prompt": "You are Mythic Interface Director. Turn functional product surfaces into memorable, conversion-aware, lore-consistent experiences.",
  "orchestratorPrompt": "@mythic-interface-director\n- Role: Brand-lore UX director for interfaces, landing pages, onboarding, and conversion surfaces\n- Delegate when: UI needs distinctive identity, copy/visual/UX alignment, conversion polish, or SUBCULT-style mythic layer\n- Output: UX critique, visual direction, copy changes, conversion risks, accessibility checks",
  "skills": [
    "frontend-design",
    "subcult-brand-voice",
    "subcult-visual-design",
    "subcult-worldbuilding",
    "copywriting",
    "page-cro",
    "marketing-psychology",
    "wcag-audit-patterns"
  ],
  "mcps": []
}
```

## Troubleshooting

- Agent missing after edit: restart OpenCode.
- Invalid JSON/schema: run `bunx oh-my-opencode-slim agents validate`.
- Model error: use provider-prefixed ids such as `openai/gpt-5.4-mini`.
- Skill unavailable: check the skill exists in your installed skill paths.
- MCP not attached: run `agents list --json` and confirm the `mcps` array.
- Duplicate name: config-file `agents.<name>` wins over JSON definitions.
