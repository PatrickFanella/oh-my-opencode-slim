---
name: homelab
description: "Homelab coordination skill for the paired nuc/almaz environment. Use when the user asks about overall homelab health, ntfy alerts, cross-host service ownership, service placement, Docker/Caddy/Cloudflare routing, backups, monitoring, incidents, or work that spans both /home/onnwee/.nuc and /home/onnwee/docs/almaz."
---

# Homelab

## Purpose

Use this skill to coordinate work across the paired `nuc` and `almaz`
homelab hosts without losing the host split, documentation sources, or safety
rules captured in the dedicated `nuc` and `almaz` skills.

This skill is the top-level router for cross-host questions. If the work is
clearly only about one host, use the dedicated host skill instead:

- `nuc`: internal Docker app/data/dashboard/monitoring host.
- `almaz`: public edge/security/storage/media/GPU/automation host.

## Safety contract

- Treat live state as authoritative. Treat `/home/onnwee/.nuc` and
  `/home/onnwee/docs/almaz` as documentation sources only after verification.
- Prefer read-only discovery before changes. Do not restart, migrate, delete,
  expose, prune, sync SnapRAID, rotate secrets, or alter backup behavior
  without explicit user approval.
- Never print secret values. For `.env`, SOPS, Borg/Restic passwords, DB
  credentials, tunnel tokens, ntfy tokens, and app secrets, report only paths,
  key names, presence, and remediation status.
- Preserve the host split unless the user explicitly asks for a migration plan:
  - `almaz`: edge/auth/tunnel/DNS/media/storage/GPU/Immich/n8n/automation.
  - `nuc`: productivity/project/dashboard/monitoring apps and ntfy.
- Keep `n8n` on `almaz`; keep `ntfy`, Prometheus, Alertmanager, and Uptime
  Kuma on `nuc` unless a deliberate migration plan exists.
- For any cross-host live claim, record which host and command/source produced
  the evidence.

## Workflow selector

1. **Cross-host triage or incident**: establish scope, then collect read-only
   evidence from both hosts before changing anything. Use the host-specific
   skills when deep-diving a single host.
2. **ntfy alert review**: inspect NUC ntfy cache/logs, identify publishers and
   topics, then trace noisy or broken publishers to their owning host/service.
   Common ownership: ntfy on `nuc`, core Alertmanager on `nuc`, n8n workflows on
   `almaz`, media/storage alerts on `almaz`.
3. **Health check**: run read-only NUC and almaz snapshots, then summarize by
   host: Docker health, monitoring path, backup posture, storage/media status,
   and active incidents.
4. **Routing/exposure check**: verify Caddy/Cloudflare/Authelia on `almaz` and
   upstream publishes on `nuc`; do not rely on docs alone for route health.
5. **Backup/storage work**: use the `almaz` skill for SnapRAID/MergerFS,
   Borgmatic, router restic, and destructive-storage guardrails; use the `nuc`
   skill for NUC router-restic and internal app backup posture.
6. **Service placement/migration**: start with a written plan. Include backup,
   restore, cutover, rollback, DNS/Caddy/Authelia effects, monitoring updates,
   and documentation updates. Ask for approval before implementation.
7. **Documentation refresh**: update the relevant host docs and timestamps only
   after live verification. If a claim spans both hosts, update both sides or
   add explicit cross-links.

## Canonical paths

- NUC docs: `/home/onnwee/.nuc`
- Almaz docs: `/home/onnwee/docs/almaz`
- NUC compose roots: `/srv/server/{dev,management,monitoring,productivity,lifestyle,projects,...}`
- Almaz compose root symlink: `/opt/server -> /mnt/spektr/server`
- Almaz active compose roots: `/opt/server/{backups,cloud,dev,management,media,monitoring,projects}`
- NUC ntfy config/cache: `/srv/server/management/data/ntfy/etc/server.yml`,
  `/srv/server/management/data/ntfy/cache/cache.db`
- NUC Alertmanager config: `/srv/server/monitoring/config/alertmanager/alertmanager.yml`
- Almaz Caddyfile: `/opt/server/management/config/caddy/Caddyfile`
- Almaz SnapRAID config: `/etc/snapraid.conf`

## Host responsibilities

### nuc

- Internal Docker app/data/dashboard host.
- Owns NUC-local productivity/project/dashboard services and monitoring stack.
- Owns `ntfy`, Prometheus, Alertmanager, Grafana, Loki, Uptime Kuma, exporters,
  and NUC Docker exposure posture.
- Active docs live under `/home/onnwee/.nuc`.

### almaz

- Public edge/security/storage/media/GPU/automation host.
- Owns Cloudflare Tunnel, Caddy, Authelia, Technitium, wg-easy, media apps,
  Immich, SnapRAID/MergerFS, Ollama/GPU workloads, and active n8n workflows.
- Active docs live under `/home/onnwee/docs/almaz`.

## Common checks

Read only by default:

```bash
# NUC health snapshot
python3 /home/onnwee/.config/opencode/blacktower/managed-skills/nuc/scripts/nuc_health_snapshot.py

# Almaz health snapshot
python3 /home/onnwee/.config/opencode/blacktower/managed-skills/almaz/scripts/almaz_health_snapshot.py

# NUC ntfy cached messages, no secrets
python3 - <<'PY'
import datetime, sqlite3, time
con = sqlite3.connect('file:/srv/server/management/data/ntfy/cache/cache.db?mode=ro', uri=True)
con.row_factory = sqlite3.Row
for row in con.execute('select time, topic, title, priority from messages where time > ? order by time desc', (int(time.time()) - 48*3600,)):
    print(datetime.datetime.fromtimestamp(row['time'], datetime.UTC).isoformat(), row['topic'], row['priority'], row['title'])
PY

# Cross-host service spot checks
rtk docker ps --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'
ssh almaz 'docker ps --format "{{.Names}}\t{{.Status}}"'
```

## Validation checklist

- Confirm which host each service currently runs on before making placement or
  routing claims.
- Confirm NUC `ntfy` health before saying notifications are healthy.
- Confirm NUC Alertmanager is running and ready before saying Prometheus alerts
  can deliver.
- Confirm almaz `n8n` health before attributing or fixing n8n-driven alerts.
- Confirm almaz Caddy/Cloudflare/Authelia state before saying public routes are
  healthy.
- Confirm backup logs/timers and repository state before saying backups are
  healthy.
- For any doc edits, run the relevant host doc audit script and targeted stale
  greps.

## Output style

- Separate verified facts from assumptions and recommendations.
- Group findings by host and by service owner.
- Be concise with the user; keep evidence paths and commands available when
  reporting operational changes.
- Mention restart/reload requirements only for components that actually changed.
