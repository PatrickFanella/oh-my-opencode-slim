---
type: reference
status: active
created: '2026-06-04'
updated: 2026-06-11
tags:
- systems/agent-skills
- api
title: API Notes
---

# API Notes

## Preferred posture

- REST + MCP over HTTPS only.
- Local REST API: `https://127.0.0.1:27124`
- Insecure HTTP stays off.
- CLI only when REST/MCP is unavailable.

## Plugin surface

- `obsidian-local-rest-api`
- `tray`
- `quickadd`
- `templater-obsidian`
- `periodic-notes`

## Safe use

- Keep API keys and TLS material out of git.
- Use `curl -k` only for local trust/bootstrap checks.
- Treat plugin data files as sensitive by default.
