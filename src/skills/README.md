# Skills catalog

This directory contains the shared skill library for the hub.

## Core references

- `CATALOG.md` — naming, canonical-vs-alias, and deprecation policy
- `QUALITY.md` — quality rubric for new and updated skills
- `AUDIT.md` — historical audit snapshot and review notes
- `index.md` — generated human-readable inventory
- `index.json` — generated machine-readable inventory

## Workflow

When the skill catalog changes:

1. Update the relevant `skills/<category>/<name>/` directory
2. Run `python3 scripts/generate_skill_index.py`
3. Run `bash scripts/validate-hub.sh`

That keeps the catalog both discoverable and validated.
