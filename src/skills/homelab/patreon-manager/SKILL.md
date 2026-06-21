---
type: documentation
status: reference
updated: 2026-06-11
tags:
- projects
- agent-tooling
- documentation
description: Patreon, changemaker, subcult.tv, Super Productivity, and Obsidian-vault
  promotion operations. Use when planning, drafting, scheduling, reviewing, or auditing
  Patreon supporter posts, public social promotion, changemaker-derived updates, subcult.tv
  companion posts, recurring Super Productivity tasks, or the Patreon docs in /home/onnwee/Projects/patreon.
name: patreon-manager
---

# Patreon Manager

Manage the Patreon growth system as an editorial + operations loop:

> Public channels show the output. Patreon shows the process.

Default workspace: `/home/onnwee/Projects/patreon`.

## Quick routing

- **Drafting a post**: read `references/content-system.md`; use `scripts/render-template.py` with an asset template.
- **Planning a week/month**: read `references/schedule.md`; check Super Productivity via `scripts/sp-patreon-status.py`.
- **Auditing docs**: run `scripts/patreon-doc-index.py /home/onnwee/Projects/patreon`.
- **Obsidian note edits**: read `references/obsidian-vault.md`; preserve YAML frontmatter + wiki links.
- **Performance review**: read `references/review-metrics.md`; update `Monthly Promotion Review.md`.

## Operating principles

1. Keep Patreon as the deeper context layer, not another public feed.
2. Prefer specific process notes: decisions, failures, screenshots, tradeoffs, next steps.
3. Rotate CTAs: soft “follow along” → medium “full process on Patreon” → hard “support directly.”
4. Connect every public post to one source: `changemaker`, `subcult.tv`, or a public project milestone.
5. Avoid generic “exclusive content.” Use “early access,” “process,” “influence,” “deeper notes.”

## Core workflow

1. **Inventory source material**
   - Read current `changemaker` entry, recent `subcult.tv` post, or project milestone.
   - Identify one strongest angle: shipped, broke, learned, chose, cut, next.
2. **Choose output lane**
   - Daily supporter note: use `assets/daily-supporter-note.md`.
   - Tuesday deep dive: use `assets/deep-dive-post.md`.
   - Thursday poll/draft/roadmap: use `assets/poll-roadmap-post.md`.
   - Sunday recap: use `assets/sunday-recap.md`.
   - Monthly review: use `assets/monthly-review.md`.
   - Public social snippet: use `assets/social-snippet-pack.md`.
3. **Draft with continuity**
   - Mention prior supporter input when relevant.
   - End with one specific question or CTA.
   - Link related docs with `[[wiki links]]` if writing into the vault.
4. **Schedule / task sync**
   - Use Super Productivity project `Patreon Growth + Promotion`.
   - Known project ID: `uEBxuO0M0uYSSkS0Ho6Ix`.
   - Do not delete or rewrite recurring templates without explicit user confirmation.
5. **Review and adjust**
   - Weekly: pick next week’s strongest angle.
   - Monthly: review metrics, update pitch, keep what drove joins/comments/clicks.

## Super Productivity rules

- Use `sp-mcp` at `/home/onnwee/.local/bin/sp-mcp` if available.
- Query before mutating.
- Preserve recurring tasks unless user explicitly asks to change them.
- Current project: `Patreon Growth + Promotion` / `uEBxuO0M0uYSSkS0Ho6Ix`.
- Current tasks documented in `/home/onnwee/Projects/patreon/Super Productivity Promotion Tasks.md`.

## Obsidian/docs rules

- Keep docs as small interlinked notes, not one giant plan.
- Use YAML frontmatter with at least: `type`, `status`, `created`, `updated`, `tags`.
- Use canonical tag hierarchy: `type/*`, `domain/*`, `status/*`, `project/*`.
- Use wiki links for relationships, e.g. `[[Patreon Posting Strategy]]`.
- Keep the MOC at `patreon-marketing-promotion-plan.md` current.
- Patreon content lives in `001 Projects/Works/Patreon/`.

## Examples

### Plan the week

User: “Use Patreon manager to plan next week.”

Do:
1. Run `scripts/sp-patreon-status.py --summary`.
2. Read `references/schedule.md` and `Weekly Promotion Schedule.md`.
3. Produce Mon–Sun plan: Patreon posts, social derivatives, review block.

### Draft daily supporter note

User: “Turn today’s changemaker into a Patreon post.”

Do:
1. Extract today’s shipped/learned/next.
2. Render `assets/daily-supporter-note.md` with `scripts/render-template.py`.
3. Keep tone direct, makerly, low-hype.

### Audit the vault

User: “Check Patreon docs consistency.”

Do:
1. Run `scripts/patreon-doc-index.py /home/onnwee/Projects/patreon --json`.
2. Fix missing frontmatter/wiki-link issues.
3. Report only broken/missing items.

## Bundled resources

- `references/content-system.md` — positioning, themes, CTA rules, post lanes.
- `references/schedule.md` — daily/weekly/monthly cadence.
- `references/obsidian-vault.md` — frontmatter and wiki-link standards.
- `references/review-metrics.md` — weekly/monthly metrics loop.
- `references/super-productivity.md` — SP MCP usage and safety.
- `scripts/render-template.py` — fill Markdown templates from CLI variables.
- `scripts/patreon-doc-index.py` — audit vault notes for frontmatter and links.
- `scripts/sp-patreon-status.py` — query Super Productivity project/task state.
- `assets/*.md` — reusable post/review/social templates.
