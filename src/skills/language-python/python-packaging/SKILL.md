---
name: python-packaging
description: Create distributable Python packages with proper project structure, setup.py/pyproject.toml, and publishing to PyPI. Use when packaging Python libraries, creating CLI tools, or distributing Python code.
---

# Python Packaging

Purpose: ship Python code as installable, versioned, distributable packages.

## Use When

- Building reusable library packages
- Shipping CLI tools via `project.scripts`
- Publishing to PyPI/TestPyPI/private index
- Standardizing package metadata and build config

## Don’t Use When

- Project is app-only and never distributed as package
- Task is deployment/runtime packaging only (containers, OS packages)

## Workflow

1. **Choose layout**
   - Prefer `src/` layout for libraries.
2. **Define metadata in `pyproject.toml`**
   - Use PEP 621 fields (`name`, `version`, `dependencies`, etc.).
3. **Configure build backend**
   - `setuptools`, `hatchling`, `flit`, or org standard.
4. **Expose CLI entry points if needed**
   - `[project.scripts]` for command installation.
5. **Build artifacts**
   - Produce wheel + sdist; run `twine check`.
6. **Publish safely**
   - TestPyPI first, then production PyPI with API tokens.
7. **Automate release path**
   - CI release workflow with tagged versioning.

## Output Checklist

- [ ] `pyproject.toml` present with valid build-system and project metadata
- [ ] Package layout chosen intentionally (`src/` preferred)
- [ ] Dependency and optional extras declared
- [ ] CLI scripts/entry points configured (if applicable)
- [ ] Build succeeds (`python -m build`)
- [ ] Artifact validation succeeds (`twine check dist/*`)
- [ ] Versioning strategy documented (static/dynamic/scm)
- [ ] Publish flow documented and token-based auth used

## Resources

- Full guide: `references/full-guide.md`
- Advanced patterns: `references/advanced-patterns.md`
