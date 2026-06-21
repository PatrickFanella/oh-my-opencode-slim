---
name: vault-monthly-maintenance
description: Monthly ars-malefica Obsidian vault maintenance workflow. Use when the user asks to run monthly vault upkeep, vault maintenance, inbox cleanup, active work review, stale workbench review, normalization audit, archive review, or to keep the non-Archive vault managed under the vault operating-system.
---

# Vault Monthly Maintenance

Use this skill for the recurring monthly pass over `/home/onnwee/Documents/ars-malefica`.

## Safety contract

- Treat `004 Archives/**` as historical storage. Do not bulk-normalize archives unless the user explicitly asks.
- Treat everything outside `004 Archives/**` as managed: every note is either normalized with vault metadata or governed by source-preserving/native-schema rules.
- Never print secrets. Check only presence/ignore status for Remotely Save and plugin data.
- Preserve source, vendor, generated, and clipping bodies. Metadata/link cleanup is OK; semantic rewrites need explicit user approval.
- Stage and commit only intended vault-maintenance changes. Leave personal Obsidian UI state (`.obsidian/bookmarks.json`, graph/icon state, workspace state) uncommitted unless the user explicitly wants UI state committed.

## Monthly workflow

1. **Snapshot state**
   - Run `git status --short --ignored`.
   - Run the helper script in dry/report mode: `python3 <skill>/scripts/vault_monthly_check.py /home/onnwee/Documents/ars-malefica`.
   - Confirm `.obsidian/plugins/remotely-save/data.json` and `.obsidian/plugins/paperless/data.json` are ignored.

2. **Empty or triage Inbox**
   - Review `000 Inbox/Inbox.md` and any non-hidden child folders.
   - Use QuickAdd buttons in Inbox for rapid capture to correct destinations.
   - Move processed imports into canonical locations or `004 Archives/Imports/...` with a manifest.
   - Do not leave active unmanaged markdown in Inbox.

3. **Review active work**
   - Open `001 Projects/Works/Active Work Dashboard.md`.
   - Check active works, paused works, stale workbenches, open decisions, and recent inbox/imports.
   - Review Kanban boards: SubBlog Pipeline, Social Pipeline, Software Pipeline.
   - Update workbench notes before editing project bodies.

4. **Run vault health checks**
   - Open `003 Resources/Systems/Vault Health Dashboard.md`.
   - Resolve missing `type`, missing `status`, stale `updated`, orphaned notes (no outgoing AND no incoming links), and source/generated review queues.
   - Open `Home.md` and verify all 8 Dataview queries render correctly (stale notes, orphans, inbox, deadlines, threads, works).
   - Use `003 Resources/Systems/Vault Quality Exceptions.md` to decide whether a note gets full vault metadata or native-schema/source-preserving management.

5. **Normalize metadata conservatively**
   - Use existing vocabulary from `003 Resources/Systems/Vault Conventions.md`.
   - Tags should use canonical hierarchy: `type/*`, `domain/*`, `status/*`, `project/*`.
   - Add `updated: YYYY-MM-DD` only when a note was touched or deliberately reviewed.
   - Generated/vendor/source-like files should normally receive `type: repository-docs` or `type: source`, `status: reference`, and useful tags.

6. **Archive finished or abandoned work**
   - Move only clearly closed/superseded material into `004 Archives/**`.
   - Add a short README/manifest for any archive batch.
   - Keep provenance links from active indexes/hubs when useful.

7. **Validate and commit**
   - Run `/usr/bin/git diff --check`.
   - Run `python3 <skill>/scripts/vault_monthly_check.py /home/onnwee/Documents/ars-malefica --json > /tmp/vault-monthly-check.json`.
   - Run `python3 -m json.tool .obsidian/plugins/quickadd/data.json >/tmp/quickadd-json-check.out` when QuickAdd-facing files changed.
   - Run `/usr/bin/git check-ignore -v .obsidian/plugins/remotely-save/data.json .obsidian/plugins/paperless/data.json`.
   - Commit in small batches by risk band: navigation/health surfaces, active work, source/generated metadata, archive manifests.

## Related

- [[003 Resources/Systems/Vault Improvement Plan|Vault Improvement Plan]] — 5-wave improvement roadmap
- Scheduled task: `vault-monthly-health` runs 1st of each month at 9am via opencode-tasks

## Bundled resources

- `references/monthly-checklist.md`: copyable checklist for a monthly maintenance note.
- `scripts/vault_monthly_check.py`: deterministic report for metadata gaps, stale workbenches, inbox markdown, Remotely Save ignore status, and uncommitted UI-state paths.
- `assets/monthly-maintenance-note.md`: template for a saved monthly maintenance report.

## Output style

- Report counts and changed paths, not secret values.
- Separate committed vault changes from uncommitted personal UI state.
- End with exact validation commands run and remaining known leftovers.
