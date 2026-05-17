---
name: python-tooling-patterns
description: "Python patterns for utility scripts, generators, document/data tooling, and small automation. Use when Python drives a tool rather than an application stack: CLI helpers, report/doc generation, file processing, validation scripts, quick data transforms, or maintaining existing Python tooling."
---

# Python Tooling Patterns

Use Python as pragmatic tooling glue, not as the default application stack. Prefer TypeScript/Go/Rust for services and CLIs unless the repo already uses Python or Python libraries are the best tool for the job.

## Keep Separate Skills For

- `uv-package-manager` — Python env/dependency workflow.
- `python-packaging` — distributable Python packages/tools.
- `python-testing-patterns` — pytest/test design.
- `python-configuration` — env/settings/secrets for Python tools.

## Defaults

- Keep scripts small, typed enough, and deterministic.
- Use `pathlib`, context managers, and explicit encodings.
- Prefer standard library first; add dependencies only when they remove real complexity.
- Use `argparse` for simple scripts; Typer only when repo already uses it or UX needs it.
- Add `if __name__ == "__main__": raise SystemExit(main())`.
- Avoid daemon/background architecture unless maintaining existing Python infra.

## Workflow

1. Confirm Python is appropriate: document/data/file processing, generator, validator, or existing Python tool.
2. Inspect repo conventions: `uv`, `pyproject.toml`, pytest, lint/format tools.
3. Implement a narrow function-based script with clear inputs/outputs.
4. Add validation/errors that fail loudly and explain remediation.
5. Add or update tests for non-trivial logic.
6. Run the relevant Python command, usually `python -m py_compile`, `pytest`, or repo script.

## Checklist

- [ ] Script has clear CLI args or documented invocation.
- [ ] File/network resources use context managers/timeouts.
- [ ] Errors include actionable messages.
- [ ] No hidden global mutable state unless intentionally cached.
- [ ] Tests cover parsing/transforms edge cases when logic is non-trivial.
- [ ] Dependencies are justified.

## Resources

Merged references preserve deeper Python app patterns for occasional lookup:

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/async-python-patterns.md` — Async Python Patterns guidance.
- `references/curated/python-anti-patterns.md` — Python Anti Patterns guidance.
- `references/curated/python-background-jobs.md` — Python Background Jobs guidance.
- `references/curated/python-code-style.md` — Python Code Style guidance.
- `references/curated/python-design-patterns.md` — Python Design Patterns guidance.
- `references/curated/python-error-handling.md` — Python Error Handling guidance.
- `references/curated/python-observability.md` — Python Observability guidance.
- `references/curated/python-performance-optimization.md` — Python Performance Optimization guidance.
- `references/curated/python-project-structure.md` — Python Project Structure guidance.
- `references/curated/python-resilience.md` — Python Resilience guidance.
- `references/curated/python-resource-management.md` — Python Resource Management guidance.
- `references/curated/python-type-safety.md` — Python Type Safety guidance.
