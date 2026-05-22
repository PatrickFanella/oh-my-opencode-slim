#!/usr/bin/env bash
# switch-provider.sh — switch board agent model provider
# Thin wrapper around: bunx oh-my-opencode-slim switch-agents
#
# Usage:
#   ./scripts/switch-provider.sh                  # show current + options
#   ./scripts/switch-provider.sh github-copilot   # switch to github-copilot
#   ./scripts/switch-provider.sh openai
#   ./scripts/switch-provider.sh anthropic
#   ./scripts/switch-provider.sh gemini
#   ./scripts/switch-provider.sh <provider> --dry-run

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec bun run --cwd "$REPO_DIR" src/cli/index.ts switch-agents "$@"
