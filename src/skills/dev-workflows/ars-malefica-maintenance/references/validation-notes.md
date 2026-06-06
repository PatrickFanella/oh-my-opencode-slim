# Validation Notes

## Recommended order

1. Check the target files.
2. Run repository validation.
3. Run workspace validation.
4. Scan staged changes for secrets.
5. Finish with `git diff --check`.

## Useful commands

```bash
python skills/ars-malefica-maintenance/scripts/validate-vault.py --root .
python skills/ars-malefica-maintenance/scripts/check-workspaces.py --root .
bash skills/ars-malefica-maintenance/scripts/scan-secrets.sh
git diff --check
```

## What the checks mean

- Vault validation: core notes/folders exist, JSON parses, workspace refs resolve.
- Workspace validation: saved workspace files parse and point at real notes.
- Secret scan: staged diff contains no obvious credentials or private keys.
