# Almaz skill examples

## Example prompts and expected approach

### “Are the almaz docs current?”

1. Read `/home/onnwee/docs/almaz/README.md` and recent runbooks/reports.
2. Run `scripts/almaz_doc_audit.py /home/onnwee/docs/almaz`.
3. Collect fresh live evidence only for claims being checked.
4. Fix current docs, update timestamps/frontmatter when present, and rerun validation.
5. Report changed files and verification results.

### “Check almaz after a Docker/NVIDIA/kernel update.”

1. Run `/usr/local/sbin/almaz-health-check.sh`.
2. Inspect `reports/health-latest.md`.
3. Pay special attention to `wg-easy`, `immich-*`, `tdarr`, `ollama`, and NVIDIA.
4. Do not declare success if any container is unhealthy/restarting or a required mount is missing.

### “Should this service live on almaz or nuc?”

1. Read `references/topology.md` and `references/service-map.md`.
2. Apply placement heuristics: storage/GPU/media/edge/DNS/VPN/Immich/n8n → almaz; productivity/project/dashboard/internal apps → nuc.
3. If stateful or public, produce a service change plan and ask for approval.

### “Run/verify backups.”

1. Read `runbooks/backups.md`.
2. Check `almaz-router-restic-backup.timer` and latest report.
3. Use restic snapshot/list/check commands without printing passwords.
4. Treat Borgmatic warnings as follow-up unless the user asks to clean Borgmatic.

### “Run a SnapRAID audit.”

1. Read latest storage audit.
2. Run read-only `snapraid status`, `snapraid diff`, `findmnt`, and SMART summaries.
3. Ask before `touch`, `sync`, or `scrub`.
4. Save findings under `infrastructure/` if the user asks for docs.

## Good answer pattern

- “Verified live” for commands just run.
- “Documented last at timestamp” for docs not rechecked live.
- “Recommendation” for architecture advice.
- “Needs approval” before disruptive/state-changing commands.

## Bad answer pattern

- Printing `.env`, DB, Borg, restic, or tunnel secret values.
- Saying Borgmatic is trusted without checking/remediating its stale lock and migrated DB entries.
- Running SnapRAID sync/scrub without approval.
- Re-opening service placement decisions casually.
- Updating historical journals/proposals while leaving active runbooks stale.
