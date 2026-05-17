# Python Packaging (Full Guide)

Comprehensive patterns for building and distributing Python packages with `pyproject.toml`.

## When to Use

- Library creation for reuse/distribution
- CLI packaging via entry points
- Publishing to PyPI/TestPyPI/private registries
- Versioning and release automation

## Core Concepts

- **Layouts**: `src/package_name/` (recommended) vs flat layout.
- **Standards**: PEP 517/518 (build), PEP 621 (metadata), PEP 660 (editable install).
- **Artifacts**: wheel (`.whl`) + source dist (`.tar.gz`).
- **Backends**: setuptools, hatchling, flit, poetry.

## Minimal Structure

```text
my-package/
├── pyproject.toml
├── README.md
├── LICENSE
├── src/
│   └── my_package/
│       ├── __init__.py
│       └── module.py
└── tests/
    └── test_module.py
```

## Minimal `pyproject.toml`

```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "my-package"
version = "0.1.0"
description = "A short description"
authors = [{name = "Your Name", email = "you@example.com"}]
readme = "README.md"
requires-python = ">=3.8"
dependencies = ["requests>=2.28.0"]

[project.optional-dependencies]
dev = ["pytest>=7.0", "black>=22.0"]
```

## Layout Patterns

## 1) Source Layout (Recommended)

```text
my-package/
├── pyproject.toml
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── core.py
│       ├── utils.py
│       └── py.typed
├── tests/
└── docs/
```

`pyproject.toml` snippet:

```toml
[tool.setuptools.packages.find]
where = ["src"]
```

Benefits: prevents accidental local imports from project root and improves test realism.

## 2) Flat Layout

```text
my-package/
├── pyproject.toml
├── my_package/
└── tests/
```

Simpler, but easier to mask packaging errors via import path bleed.

## 3) Multi-Package Repo

```text
project/
├── pyproject.toml
├── packages/
│   ├── package-a/
│   └── package-b/
└── tests/
```

Useful for monorepo-style package families.

## Full-Featured `pyproject.toml` Areas

Include as needed:

- `project.classifiers`, `project.urls`, `project.keywords`
- `project.optional-dependencies` for `dev`, `docs`, etc.
- `project.scripts` for CLI commands
- `[tool.*]` sections for black/ruff/mypy/pytest/coverage

## Dynamic Versioning Patterns

### Attribute-based version

```toml
[project]
name = "my-package"
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "my_package.__version__"}
```

### SCM/git-based version

```toml
[build-system]
requires = ["setuptools>=61.0", "setuptools-scm>=8.0"]
build-backend = "setuptools.build_meta"

[tool.setuptools_scm]
write_to = "src/my_package/_version.py"
```

## CLI Packaging

### Click-based CLI

```python
import click

@click.group()
@click.version_option()
def cli():
    pass

@cli.command()
@click.argument("name")
def greet(name: str):
    click.echo(f"Hello, {name}!")

def main():
    cli()
```

Register:

```toml
[project.scripts]
my-tool = "my_package.cli:main"
```

### argparse-based CLI

Use when dependency-free CLI is preferred; still register entry point through `project.scripts`.

## Build and Publish Flow

### Local build and checks

```bash
pip install build twine
python -m build
twine check dist/*
```

### Publish safely

```bash
# dry run to TestPyPI
twine upload --repository testpypi dist/*

# then production
twine upload dist/*
```

Use token auth in `~/.pypirc`:

```text
[pypi]
username = __token__
password = pypi-...
```

### CI publish (tag/release driven)

Typical workflow:

1. Checkout
2. Setup Python
3. Install `build` + `twine`
4. Build package
5. `twine check`
6. Upload with `TWINE_USERNAME=__token__` + secret token

## Release Checklist

- [ ] Version bumped/resolved
- [ ] Changelog/release notes updated
- [ ] Wheel + sdist generated
- [ ] `twine check` passes
- [ ] Install test from built artifact succeeds
- [ ] Publish to TestPyPI validated (recommended)
- [ ] Production publish executed via token auth

## Related Material

- Advanced packaging patterns: `advanced-patterns.md`
