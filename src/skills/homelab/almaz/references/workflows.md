# Almaz workflows

## Table of contents

- [Answer an almaz question](#answer-an-almaz-question)
- [Refresh documentation against live state](#refresh-documentation-against-live-state)
- [Run health or post-upgrade checks](#run-health-or-post-upgrade-checks)
- [Check backups](#check-backups)
- [Audit SnapRAID/storage](#audit-snapraidstorage)
- [Plan a service change](#plan-a-service-change)
- [Handle incidents and reports](#handle-incidents-and-reports)
- [Secrets handling](#secrets-handling)

## Answer an almaz question

1. Read `/home/onnwee/docs/almaz/README.md` for current baseline and navigation.
2. Read the narrow active doc under `services/`, `infrastructure/`, `runbooks/`, or `reports/`.
3. If the answer depends on current infrastructure state, collect fresh live evidence before answering.
4. State whether each important claim is verified live, documented only, or a recommendation.

## Refresh documentation against live state

1. Run:

   ```bash
   python3 /home/onnwee/.agents/skills/almaz/scripts/almaz_doc_audit.py /home/onnwee/docs/almaz
   ```

2. Collect live state using read-only commands or:

   ```bash
   python3 /home/onnwee/.agents/skills/almaz/scripts/almaz_health_snapshot.py
   ```

3. Compare active docs to live state. Treat dated journals/proposals as historical unless the user asks to rewrite history.
4. Update current docs and `last_reviewed`/frontmatter timestamps when present.
5. Rerun the audit and targeted stale greps.
6. Report changed files and verification results.

Minimum consistency checks:

- OS/kernel state says Ubuntu 26.04 LTS `resolute`, not 25.10 `questing`.
- active docs do not say router backup is only scaffold/not enabled.
- `wg-easy` docs mention `/lib/modules:/lib/modules:ro`.
- Caddy docs do not describe stale `languagetool` as an active bug.
- Cloudflared docs mention `edda.subcult.tv` direct route to nuc if still configured.
- terminal/desktop docs do not describe KDE/SDDM/WezTerm as current.

## Run health or post-upgrade checks

1. Run:

   ```bash
   sudo /usr/local/sbin/almaz-health-check.sh
   ```

2. Inspect `/home/onnwee/docs/almaz/reports/health-latest.md`.
3. If failures appear, triage in this order: apt/dpkg, failed units, mounts, Docker unhealthy/restarting containers, NVIDIA, critical containers, SnapRAID status.
4. Do not claim success until failures are resolved or explicitly documented.

## Check backups

1. Read `/home/onnwee/docs/almaz/runbooks/backups.md`.
2. Check timer/report:

   ```bash
   systemctl list-timers almaz-router-restic-backup.timer
   journalctl -u almaz-router-restic-backup.service -n 120 --no-pager
   sed -n '1,120p' /home/onnwee/docs/almaz/reports/router-restic-backup.md
   ```

3. List restic snapshots without printing secrets:

   ```bash
   sudo RESTIC_PASSWORD_FILE=/etc/almaz-router-backup/restic-password \
     restic -r sftp:root@10.0.0.1:/tmp/mountd/disk1_part1/almaz-restic \
     -o 'sftp.args=-i /home/onnwee/.ssh/id_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=no' snapshots
   ```

4. Treat Borgmatic as secondary until cleaned and restore-tested.

## Audit SnapRAID/storage

Use read-only commands unless the user approves changes:

```bash
sudo snapraid status
sudo snapraid diff
findmnt /mnt/arkhiv /mnt/spektr /mnt/rezerv /mnt/kamera1 /mnt/kamera2 /mnt/kamera3 /mnt/impuls
sudo smartctl -H /dev/sda
```

Ask before running `snapraid touch`, `snapraid sync`, `snapraid scrub`, deleting files, or changing `/etc/fstab`/MergerFS policy.

## Plan a service change

1. Use `assets/templates/service-change-plan.md` via `scripts/render_template.py`.
2. Decide host placement with this bias:
   - edge/auth/tunnel/DNS/media/storage/GPU/Immich/n8n: `almaz`
   - productivity/project/dashboard/internal data apps: `nuc`
3. Identify state, ports, DNS/Caddy/Cloudflare routes, firewall impact, backup coverage, rollback, and docs updates.
4. Ask for approval before applying the plan.
5. After implementation, update service docs and run the health check.

Avoid migrations of media, Immich, SnapRAID/MergerFS, edge ingress, DNS primary, wg-easy, or n8n unless the user explicitly wants a migration plan.

## Handle incidents and reports

1. Use `assets/templates/incident-note.md` for incidents and `assets/templates/doc-freshness-report.md` for freshness reports.
2. Record timeline, scope, evidence, actions taken, verification, and follow-ups.
3. Keep commands redacted when they might reveal tokens or credentials.
4. Save reports under `/home/onnwee/docs/almaz/reports/` only when the user asks to write docs.

## Secrets handling

- Do not print secret values from `.env`, SOPS, Docker env, databases, Borgmatic YAML, or restic password files.
- Prefer key names and file paths: `DATABASE_URL present in /path/.env`, not the value.
- For backup/secrets work, mirror the nuc pattern: encrypted archive, manifest checksums, verify command, restore dry-run command.
- If a live command could expose secrets, ask first or choose a safer command.
