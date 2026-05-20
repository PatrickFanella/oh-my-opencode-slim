# NUC skill examples

## Example prompts and expected approach

### “Is the NUC documentation accurate?”

1. Read `NUC Hub.md`, `10-inventory/nuc.md`, `20-operations/docker-port-matrix.md`, and `50-reports/docs-freshness.md`.
2. Run `scripts/nuc_doc_audit.py /home/onnwee/.nuc`.
3. Collect fresh live evidence only for claims being checked.
4. Fix active docs, update timestamps, and rerun validation.
5. Report verified counts and changed files.

### “Should we move services from nuc to almaz?”

1. Read `references/topology.md` and `references/service-map.md`.
2. Check current load/resource data before recommending migrations.
3. Prefer no broad migration; propose targeted duplication or scheduling/resource tuning first.
4. Treat stateful migrations as separate plans.

### “Add a new public app on the NUC.”

1. Read `40-runbooks/add-new-service.md`.
2. Render `assets/templates/service-change-plan.md`.
3. Define compose root, network, host bind, Caddy route on `almaz`, firewall guard implication, backup, smoke test, and docs update.
4. Ask for approval before making live changes.

### “Check if Docker ports are exposed.”

1. Gather live Docker publish data.
2. Check wildcard publishes, explicit NUC binds, localhost DB binds, and guard chains.
3. Report direct exposure separately from Caddy-mediated public routes.

### “n8n is unhealthy.”

1. Remember active n8n is on `almaz`, not `nuc`.
2. Read n8n runbooks and current state docs.
3. Use safe health checks first.
4. Do not start a NUC n8n definition unless the user explicitly approves a migration/recovery plan.

## Good answer pattern

- “Verified live” for commands just run.
- “Documented last at timestamp” for docs not rechecked live.
- “Recommendation” for architecture advice.
- “Needs approval” before any destructive or state-changing command.

## Bad answer pattern

- Saying Docker publishes broadly without checking current binds.
- Treating `almaz-dash` as proof the dashboard belongs on `almaz`.
- Re-opening n8n placement casually.
- Printing `.env` or token values.
- Updating archive docs while leaving active docs stale.
