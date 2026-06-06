# Git Safety

## Rules

- Stage only intended files.
- Leave unrelated dirty files alone.
- Never commit secrets, tokens, API keys, or private keys.
- Prefer small reversible commits with one purpose.

## Commit shape

- Use concise conventional messages.
- Run `git diff --cached --check` before committing.
- If a validation script fails, fix that first; do not force the commit.

## Secret-prone places

- `.obsidian/plugins/*/data.json`
- `.obsidian/community-plugins.json`
- workspace JSON that stores file paths or UI state
- any ad hoc automation notes copied from terminals or APIs
