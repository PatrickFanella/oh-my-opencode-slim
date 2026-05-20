# NUC workflows

## Table of contents

- [Answer a NUC question](#answer-a-nuc-question)
- [Refresh documentation against live state](#refresh-documentation-against-live-state)
- [Check Docker exposure](#check-docker-exposure)
- [Check Almaz Caddy routes to NUC](#check-almaz-caddy-routes-to-nuc)
- [Plan a service change](#plan-a-service-change)
- [Handle incidents and reports](#handle-incidents-and-reports)
- [Secrets handling](#secrets-handling)

## Answer a NUC question

1. Read `/home/onnwee/.nuc/NUC Hub.md` for navigation.
2. Read the narrow active doc under `10-inventory/`, `20-operations/`, `30-plans/`, `40-runbooks/`, or `50-reports/`.
3. If the answer depends on current infrastructure state, collect fresh live evidence before answering.
4. State whether each important claim is verified live, documented only, or a recommendation.

## Refresh documentation against live state

1. Run:

   ```bash
   python3 /home/onnwee/.config/opencode/skills/nuc/scripts/nuc_doc_audit.py /home/onnwee/.nuc
   ```

2. Collect live state using read-only commands or:

   ```bash
   python3 /home/onnwee/.config/opencode/skills/nuc/scripts/nuc_health_snapshot.py
   ```

3. Compare active docs outside `90-archive` to live state. Do not update archive docs unless asked.
4. Update `updated:` metadata and any affected freshness/report sections.
5. Rerun `nuc_doc_audit.py` and targeted greps for stale phrases.
6. Report changed files and verification results.

Minimum consistency checks:

- active markdown has YAML frontmatter
- active frontmatter contains at least one of `created`/`updated`; use `nuc_doc_audit.py --require-created-updated` when normalizing both fields across every doc
- Docker publish counts and wildcard status are current
- firewall guard persistence is described correctly
- Almaz Caddy NUC upstream count and missing-port status are current
- n8n placement language does not re-open an already-settled decision
- dashboard docs explain the `almaz-dash` legacy name

## Check Docker exposure

1. Verify Docker publishes from live state; do not rely on old `docker ps` snippets.
2. Confirm no `0.0.0.0` or `[::]` wildcard publishes before claiming direct exposure is closed.
3. Confirm DB host ports bind to `127.0.0.1` when documenting internal-only data services.
4. Confirm `nuc-docker-user-policy.service` is enabled/active or document any failure.
5. Inspect `DOCKER-USER`, `NUC-DOCKER-GUARD`, `INPUT`, and `NUC-HOST-PORT-GUARD` before changing firewall language.
6. After any port change, search active docs/config references for the old port and update or intentionally preserve each match.

Useful docs:

- `/home/onnwee/.nuc/20-operations/docker-port-matrix.md`
- `/home/onnwee/.nuc/30-plans/2026-05-17-docker-exposure-hardening.md`
- `/home/onnwee/.nuc/50-reports/server-weekly-hygiene.md`

## Check Almaz Caddy routes to NUC

1. Read the active Caddyfile on `almaz`: `/opt/server/management/config/caddy/Caddyfile`.
2. Extract host blocks that proxy to `10.0.0.56` or NUC hostnames.
3. Compare unique upstream ports to live NUC Docker host publishes.
4. Smoke test HTTPS routes only when safe and useful; app-level `401` can be expected for protected apps.
5. Update route counts in docs if they changed.

Last verified baseline: 58 top-level host blocks, 26 NUC-backed host blocks, 35 unique NUC upstream ports, 0 missing live publishes.

## Plan a service change

1. Use `assets/templates/service-change-plan.md` via `scripts/render_template.py`.
2. Read `/home/onnwee/.nuc/40-runbooks/add-new-service.md`.
3. Decide host placement with this bias:
   - edge/auth/tunnel/media/storage/automation: `almaz`
   - internal apps/data/project/productivity/dashboard/monitoring: `nuc`
4. Identify state, ports, DNS/Caddy routes, firewall guard changes, backups, rollback, and docs updates.
5. Ask for approval before applying the plan.
6. After implementation, update `/home/onnwee/.nuc/20-operations/docker-port-matrix.md` first, then any route inventory, service inventory, weekly report, or freshness report whose counts/claims changed.

Avoid migrations of Postgres, Gitea, Vaultwarden, Paperless, MinIO, CouchDB, media, Immich, edge ingress, or n8n unless the user explicitly wants a migration plan.

## Handle incidents and reports

1. Use `assets/templates/incident-note.md` for incidents and `assets/templates/doc-freshness-report.md` for freshness reports.
2. Record timeline, scope, evidence, actions taken, verification, and follow-ups.
3. Keep commands redacted when they might reveal tokens or credentials.
4. Save reports under `/home/onnwee/.nuc/50-reports/` only when the user asks to write docs.

## Secrets handling

- Do not print secret values from `.env`, SOPS, Docker env, databases, or app config.
- Prefer key names and file paths: `DATABASE_URL present in /path/.env`, not the value.
- Read `/home/onnwee/.nuc/20-operations/secrets-inventory.md` before changing secrets docs.
- Use `/home/onnwee/.nuc/40-runbooks/secret-rotation-index.md` for rotation planning.
- If a live command could expose secrets, ask first or choose a safer command.
