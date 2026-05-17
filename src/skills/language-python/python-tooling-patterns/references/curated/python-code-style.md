# Python Code Style

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-code-style-skill.md`

_Source topic: python-code-style_

**Purpose:** Python code style, linting, formatting, naming conventions, and documentation standards. Use when writing new code, reviewing style, configuring linters, writing docstrings, or establishing project standards.

# Python Code Style & Documentation

Consistent code style and clear documentation make codebases maintainable and collaborative. This skill covers modern Python tooling, naming conventions, and documentation standards.

## When to Use This Skill

- Setting up linting and formatting for a new project
- Writing or reviewing docstrings
- Establishing team coding standards
- Configuring ruff, mypy, or pyright
- Reviewing code for style consistency
- Creating project documentation

## Core Concepts

### 1. Automated Formatting

### 2. Consistent Naming

### 3. Documentation as Code

### 4. Type Annotations

## Quick Start

```bash

# Configure in pyproject.toml
[tool.ruff]
line-length = 120
target-version = "py312"  # Adjust based on your project's minimum Python version

[tool.mypy]
strict = true
```

## Fundamental Patterns

### Pattern 1: Modern Python Tooling

Use `ruff` as an all-in-one linter and formatter. It replaces flake8, isort, and black with a single fast tool.

```toml

# pyproject.toml
[tool.ruff]
line-length = 120
target-version = "py312"  # Adjust based on your project's minimum Python version

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors

```

Run with:

```bash
```

### Pattern 2: Type Checking Configuration

Configure strict type checking for production code.

```toml

# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
disallow_incomplete_defs = true

```

Alternative: Use `pyright` for faster checking.

```toml
```

### Pattern 3: Naming Conventions

Follow PEP 8 with emphasis on clarity over brevity.

**Files and Modules:**

```python
