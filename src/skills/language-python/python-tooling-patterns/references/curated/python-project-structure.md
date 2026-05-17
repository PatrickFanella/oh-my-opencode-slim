# Python Project Structure

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-project-structure-skill.md`

_Source topic: python-project-structure_

**Purpose:** Python project organization, module architecture, and public API design. Use when setting up new projects, organizing modules, defining public interfaces with __all__, or planning directory layouts.

# Python Project Structure & Module Architecture

Design well-organized Python projects with clear module boundaries, explicit public interfaces, and maintainable directory structures. Good organization makes code discoverable and changes predictable.

## When to Use This Skill

- Starting a new Python project from scratch
- Reorganizing an existing codebase for clarity
- Defining module public APIs with `__all__`
- Deciding between flat and nested directory structures
- Determining test file placement strategies
- Creating reusable library packages

## Core Concepts

### 1. Module Cohesion

### 2. Explicit Interfaces

Define what's public with `__all__`. Everything not listed is an internal implementation detail.

### 3. Flat Hierarchies

### 4. Consistent Conventions

## Quick Start

```
myproject/
├── src/
│   └── myproject/
│       ├── __init__.py
│       ├── services/
│       ├── models/
│       └── api/
├── tests/
├── pyproject.toml
└── README.md
```

## Fundamental Patterns
...

# user.py - Contains service, repository, models, utilities...
```

### Pattern 2: Explicit Public APIs with `__all__`

Define the public interface for every module. Unlisted members are internal implementation details.

```python

# from .internal_helpers import _validate_input  # Not exported
```

### Pattern 3: Flat Directory Structure

Prefer minimal nesting. Deep hierarchies make imports verbose and navigation difficult.

```

# Preferred: Flat structure
project/
├── api/
│   ├── routes.py
│   └── middleware.py
├── services/
│   ├── user_service.py
│   └── order_service.py
    └── validation.py

# Avoid: Deep nesting
project/core/internal/services/impl/user/
```

Add sub-packages only when there's a genuine sub-domain requiring isolation.

### Pattern 4: Test File Organization

Choose one approach and apply it consistently throughout the project.

**Option A: Colocated Tests**

```
```

Benefits: Tests live next to the code they verify. Easy to see coverage gaps.

**Option B: Parallel Test Directory**
