---
name: nuc
description: "NUC homelab operations, documentation, and safety workflows for /home/onnwee/.nuc and the nuc/almaz Docker stack. Use when the user asks about NUC docs, service placement, Docker/Caddy exposure, firewall guards, resource baselines, runbooks, n8n/ntfy ownership, or homelab health checks."
---

# NUC

## Purpose

Use this skill to operate, audit, and update the NUC homelab documentation and the `nuc`/`almaz` service split without re-discovering the topology from scratch.

## Safety contract

- Treat live state as authoritative for operations; treat `/home/onnwee/.nuc` as the active documentation source of truth after verification.
- Prefer read-only discovery before proposing changes. Do not restart, migrate, delete, expose, or rotate anything without explicit user approval.
- Never print secret values. For `.env`, SOPS, tokens, and credentials, report only file paths, key names, and remediation status.
- Preserve the current architecture unless the user asks for a migration plan: `almaz` is edge/auth/tunnel/media/storage/automation; `nuc` is internal Docker app/data/dashboard host.
- Keep `n8n` on `almaz` unless there is a deliberate migration plan with backup/restore, cutover, and dormant NUC definition handling.
- Keep legacy-named `almaz-dash` on `nuc`; document it as a homelab/dashboard app with historical naming.
- When updating docs, update timestamps/frontmatter and verify stale claims are gone.

## Workflow selector

1. **Docs or inventory question**: read `NUC Hub.md`, then the narrow doc in `10-inventory/`, `20-operations/`, `30-plans/`, `40-runbooks/`, or `50-reports/`. Use `references/topology.md` for current mental model.
2. **Documentation refresh/audit**: run `scripts/nuc_doc_audit.py /home/onnwee/.nuc`, collect live evidence, edit active docs, then rerun the audit. Read `references/workflows.md` first.
3. **Health or exposure check**: run `scripts/nuc_health_snapshot.py` for a read-only snapshot. For firewall/Caddy/Docker details, verify live state before relying on historical docs.
4. **Service add/change/migration**: start with a written plan using `assets/templates/service-change-plan.md`; read `40-runbooks/add-new-service.md` and `references/service-map.md`.
5. **Incident or weekly report**: render a template with `scripts/render_template.py`, gather evidence, and save under the appropriate `.nuc/50-reports/` or runbook path if the user asks.

## Canonical paths

- NUC docs: `/home/onnwee/.nuc`
- NUC compose roots: `/srv/server/{dev,management,monitoring,productivity,projects,...}` plus project folders under `/srv/server/projects/`
- NUC active inventory: `/home/onnwee/.nuc/10-inventory/nuc.md`
- Compose source of truth: `/home/onnwee/.nuc/10-inventory/compose-source-of-truth.md`
- Docker exposure matrix: `/home/onnwee/.nuc/20-operations/docker-port-matrix.md`
- Almaz Caddyfile path documented for edge validation: `/opt/server/management/config/caddy/Caddyfile` on `almaz`

## Bundled resources

Read only what is needed:

- `references/topology.md` — current NUC/almaz roles, placement decisions, and verified baseline facts.
- `references/workflows.md` — procedures for doc refreshes, exposure checks, route checks, service changes, and incidents.
- `references/service-map.md` — compose projects, networks, route expectations, and key ownership notes.
- `references/examples.md` — realistic user prompts and response patterns for this skill.
- `scripts/nuc_doc_audit.py` — frontmatter/metadata/stale-claim audit for `.nuc` markdown.
- `scripts/nuc_health_snapshot.py` — read-only NUC host/Docker/firewall snapshot helper.
- `scripts/render_template.py` — render templates from `assets/templates/` with `--var key=value`.
- `assets/templates/` — Markdown templates for doc freshness reports, service change plans, incident notes, and service inventory entries.

## Validation checklist

- Run `python3 scripts/nuc_doc_audit.py /home/onnwee/.nuc` after doc edits.
- For live posture claims, record the exact command/source and timestamp in the doc.
- Confirm active docs outside `90-archive` have YAML frontmatter and created/updated metadata; use `--require-created-updated` when intentionally enforcing both fields on every doc.
- Confirm current Docker publish posture before saying ports are exposed or protected.
- Confirm Almaz Caddy upstream ports still have live NUC publishes before saying routes are healthy.
- If any script reports a possible issue, inspect the cited file/command before editing.

## Output style

- Be concise with the user, but keep docs evidence-rich.
- Separate verified facts from recommendations.
- Prefer small targeted changes over broad migrations.
- Include restart/reload notes only when a changed component actually requires them.
