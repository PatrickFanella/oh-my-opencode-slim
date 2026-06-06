---
name: ars-malefica-maintenance
description: "Vault/repository maintenance for ars-malefica. Use when validating vault structure, archive/redirect hygiene, workspace integrity, plugin/API posture, git safety, or staged secret checks. Triggers: maintenance, validate vault, archive, redirects, workspaces, plugin check, API posture, git safety, secret scan, repo health."
---

# Ars Malefica Maintenance

Use for safe repo/vault upkeep.

## Read first

- `references/vault-map.md` for the current vault surface.
- `references/validation-notes.md` for what to check before commit.
- `references/git-safety.md` for staging and dirty-file rules.

## Workflow

1. Inspect the target surface and keep changes reversible.
2. Prefer validation over deletion; archive first, remove later.
3. Keep plugin/API data secret-free; never stage secret-bearing blobs.
4. Run the bundled validation scripts before committing:
   - `scripts/validate-vault.py`
   - `scripts/check-workspaces.py`
   - `scripts/scan-secrets.sh`
5. Finish with `git diff --check` and a staged secret scan.

## Guardrails

- Do not touch unrelated dirty files.
- Do not introduce insecure HTTP or ad hoc secret storage.
- Prefer deterministic scripts over manual one-offs.
- Keep archive mappings and redirects updated when files move.

## When to use scripts

- Use `validate-vault.py` for vault-level structure and JSON sanity.
- Use `check-workspaces.py` for workspace references and layout integrity.
- Use `scan-secrets.sh` on staged changes before commit.
