# Switch Provider Guide

`scripts/switch-provider.sh <provider>` forwards to
`bun run --cwd "$REPO_DIR" src/cli/index.ts switch-agents "$@"`.
The CLI reads a single data file:

- `src/cli/provider-assignment-guide.json`

## Schema

- `boardAgentModelTiers`: provider -> `{ coding, heavy, light }`
- `boardAgentModelOverrides`: provider -> per-board-agent model overrides
- `coreAgentProviderTiers`: core agent -> tier key
- `coreAgentVariants`: core agent -> optional variant
- `coreAgentModelOverrides`: provider -> per-core-agent model overrides
- `boardAgentTiers`: custom board agent -> tier key
- `availableModels`: deduped list of model IDs used by provider switch data and
  built-in generated presets

## Supported providers

- `github-copilot`
- `openai`
- `openrouter`
- `anthropic`
- `gemini`

## Tier meaning

- `coding`: implementation/review agents
- `heavy`: reasoning/strategy/creative agents
- `light`: retrieval, docs, growth, quick advisory agents

## Assignment sources

- Board provider presets: `src/cli/providers.ts`
- Default board agent model selection: `src/agents/default-board-agents.ts`
- Provider switch writes both the board preset and custom board agent JSON files

## Current available models

- `openai/gpt-5.5`
- `openai/gpt-5.4`
- `openai/gpt-5.4-mini`
- `github-copilot/gpt-5.5`
- `github-copilot/gpt-5.4`
- `github-copilot/gpt-5.4-mini`
- `anthropic/claude-sonnet-4-6`
- `anthropic/claude-sonnet-4-5`
- `anthropic/claude-haiku-4-5`
- `google/gemini-2.5-pro`
- `google/gemini-2.5-flash`
- `kimi-for-coding/k2p5`
- `github-copilot/claude-opus-4.6`
- `github-copilot/grok-code-fast-1`
- `github-copilot/gemini-3.1-pro-preview`
- `github-copilot/claude-sonnet-4.6`
- `zai-coding-plan/glm-5`
- `opencode-go/glm-5.1`
- `opencode-go/deepseek-v4-pro`
- `opencode-go/minimax-m2.7`
- `opencode-go/kimi-k2.6`
- `opencode-go/deepseek-v4-flash`
- `openrouter/deepseek/deepseek-v4-flash`
- `openrouter/deepseek/deepseek-v4-pro`
- `openrouter/deepseek/deepseek-v3.2`
- `openrouter/minimax/minimax-m2.5`
- `openrouter/moonshotai/kimi-k2.7-code`

## OpenRouter cost profile

`openai` is the default hybrid provider. It keeps sparse `openai/gpt-5.5`
assignments for the highest-leverage core/review roles and routes most
long-lived board specialists through cheap OpenRouter DeepSeek/MiniMax models.

`openrouter` is tuned for cheap persistent board sessions:

- coding/build advisors default to `deepseek-v4-flash`
- complex security, SRE, agent-systems, and maintainer strategy advisors use
  `deepseek-v4-pro`
- docs, growth, product, and creative advisors use `minimax-m2.5`

DeepSeek models are preferred for long-lived sessions because OpenRouter can reuse
prompt caches when routing stays sticky. Use `switch-agents openrouter` to write
the board files and active `board-openrouter` core preset.
