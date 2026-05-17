---
name: webapp-testing
description: Test local or remote web applications with browser automation and QA workflows. Use for Playwright-style UI flow checks, screenshots, console/network debugging, accessibility smoke tests, exploratory web QA, and validating frontend behavior after implementation.
---

# Webapp Testing

Use one browser-testing skill for Playwright, ScoutQA-style exploratory QA, screenshots, console logs, network inspection, and frontend behavior checks.

## Defaults

- Prefer built-in browser automation tools when available.
- Use existing helper scripts before writing one-off automation.
- Keep tests deterministic: explicit waits for app state, not arbitrary long sleeps.
- Capture console/network errors for debugging UI failures.
- For local apps, start/stop servers cleanly with `scripts/with_server.py` when useful.

## Workflow

1. Identify target URL/app command and user flow.
2. Start app if local; verify server is reachable.
3. Use browser automation for the smallest representative flow.
4. Check visible state, console errors, network failures, screenshots when useful.
5. Report bugs with repro steps and source-level likely cause.
6. For durable regressions, add/adjust tests in the repo’s chosen test framework.

## Resources

- `references/full-guide.md` — general webapp testing guidance.
- `scripts/with_server.py` — helper for running browser tests with a local server.
- `examples/` — small browser automation examples.

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/e2e-testing-patterns.md` — E2E Testing Patterns guidance.
- `references/curated/playwright.md` — Playwright guidance.
- `references/curated/scoutqa-test.md` — Scoutqa Test guidance.


### Extracted resource directories

- `references/` — curated resources extracted from prior merged skill material.
- `scripts/` — curated resources extracted from prior merged skill material.
- `assets/` — curated resources extracted from prior merged skill material.
- `examples/` — curated resources extracted from prior merged skill material.
