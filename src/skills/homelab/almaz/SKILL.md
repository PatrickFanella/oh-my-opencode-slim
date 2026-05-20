---
name: almaz
description: "Almaz homelab operations, documentation, backup, storage, GPU/media, and safety workflows for /home/onnwee/docs/almaz and /opt/server. Use when the user asks about almaz docs, service placement versus nuc, Docker/Caddy/Cloudflare/Authelia/wg-easy/Technitium, media or Immich services, NVIDIA/Ollama/Tdarr, SnapRAID/MergerFS storage, router restic backups, Borgmatic cleanup, health checks, or post-upgrade maintenance."
---

# Almaz

## Purpose

Use this skill to operate, audit, and update the `almaz` homelab host without re-discovering the topology from scratch. `almaz` is the public edge/security/storage/media/GPU host paired with `nuc`, which owns productivity/project/dashboard apps.

## Safety contract

- Treat live state as authoritative for operations; treat `/home/onnwee/docs/almaz` as the active documentation source of truth after verification.
- Prefer read-only discovery before changes. Do not restart, migrate, delete, expose, prune, sync SnapRAID, rotate secrets, or alter backups without explicit user approval.
- Never print secret values. For `.env`, SOPS, Borg/Restic passwords, DB credentials, tunnel tokens, and app secrets, report only paths, key names, presence, and remediation status.
- Preserve the current host split unless the user asks for a migration plan: `almaz` owns edge/auth/tunnel/DNS/media/storage/GPU/Immich/n8n; `nuc` owns productivity/project/dashboard/monitoring apps.
- Keep media, Immich, SnapRAID/MergerFS, GPU workloads, and primary edge services on `almaz` unless a deliberate migration plan includes backup/restore, cutover, rollback, and docs updates.
- When updating docs, update current claims, timestamps/frontmatter when present, and verify stale phrases are gone.

## Workflow selector

1. **Docs or inventory question**: read `/home/onnwee/docs/almaz/README.md`, then the narrow doc in `services/`, `infrastructure/`, `runbooks/`, `reports/`, `proposals/`, or `reviews/`. Use `references/topology.md` for current mental model.
2. **Documentation refresh/audit**: run `scripts/almaz_doc_audit.py /home/onnwee/docs/almaz`, collect live evidence, edit active docs, then rerun audit and targeted stale greps. Read `references/workflows.md` first.
3. **Health/post-upgrade check**: run `/usr/local/sbin/almaz-health-check.sh` or `scripts/almaz_health_snapshot.py` for read-only evidence. For Docker, NVIDIA, Caddy, storage, and backup posture, verify live state before relying on historical docs.
4. **Backup work**: read `runbooks/backups.md` and `references/workflows.md`. `almaz-router-restic-backup.timer` is primary router backup; Borgmatic exists but is secondary/untrusted until stale lock and old DB entries are cleaned up.
5. **SnapRAID/storage work**: read `infrastructure/storage-audit-2026-05-18.md`; collect status/diff/SMART evidence. Ask before running `snapraid touch`, `sync`, `scrub`, or any destructive filesystem command.
6. **Service add/change/migration**: start with `assets/templates/service-change-plan.md`; read `references/service-map.md` and `infrastructure/host-duties.md`; ask for approval before live changes.
7. **Incident or report**: render `assets/templates/incident-note.md` or `doc-freshness-report.md`, gather evidence, and save under `reports/` only when asked.

## Canonical paths

- Almaz docs: `/home/onnwee/docs/almaz`
- Almaz compose root symlink: `/opt/server -> /mnt/spektr/server`
- Active compose roots: `/opt/server/{backups,cloud,dev,management,media,monitoring,projects}`
- Caddyfile: `/opt/server/management/config/caddy/Caddyfile`
- SnapRAID config: `/etc/snapraid.conf`
- MergerFS mount: `/mnt/arkhiv` over `/mnt/kamera1:/mnt/kamera2:/mnt/kamera3`
- Router backup script/timer: `/usr/local/sbin/almaz-router-restic-backup.sh`, `almaz-router-restic-backup.timer`
- Health check script/timer: `/usr/local/sbin/almaz-health-check.sh`, `almaz-health-check.timer`
- Router USB restic repo: `sftp:root@10.0.0.1:/tmp/mountd/disk1_part1/almaz-restic`

## Bundled resources

Read only what is needed:

- `references/topology.md` — current almaz/nuc roles, verified baseline facts, storage and backup posture.
- `references/service-map.md` — compose projects, critical containers, networks, ownership notes, and fragile service guidance.
- `references/workflows.md` — procedures for doc refreshes, health checks, backup checks, storage audits, service changes, and incidents.
- `references/examples.md` — realistic user prompts and expected response patterns.
- `scripts/almaz_doc_audit.py` — frontmatter/stale-claim audit for `/home/onnwee/docs/almaz` markdown.
- `scripts/almaz_health_snapshot.py` — read-only host/Docker/storage/backup snapshot helper.
- `scripts/render_template.py` — render templates from `assets/templates/` with `--var key=value`.
- `assets/templates/` — Markdown templates for doc freshness reports, service change plans, incident notes, and service inventory entries.

## Validation checklist

- Run `python3 scripts/almaz_doc_audit.py /home/onnwee/docs/almaz` after doc edits.
- For live posture claims, record command/source and timestamp in the doc or final answer.
- Confirm OS/kernel before saying upgrade state is current: expected baseline is Ubuntu 26.04 LTS `resolute`, kernel `7.0.0-15-generic` as of 2026-05-18.
- Confirm Docker health before saying services are healthy: no unhealthy/restarting containers and critical containers running.
- Confirm `/mnt/arkhiv`, `/mnt/spektr`, `/mnt/rezerv`, `/mnt/kamera1-3`, and `/mnt/impuls` before making storage claims.
- Confirm `nvidia-smi` and `nvidia-container-toolkit` before making GPU/container runtime claims.
- Confirm `almaz-router-restic-backup.timer` and latest report before saying router backups are active.
- If any script reports a possible issue, inspect the cited file/command before editing.

## Output style

- Be concise with the user, but keep docs evidence-rich.
- Separate verified facts from recommendations.
- Prefer small targeted fixes over broad migrations.
- Include restart/reload notes only when a changed component actually requires them.
