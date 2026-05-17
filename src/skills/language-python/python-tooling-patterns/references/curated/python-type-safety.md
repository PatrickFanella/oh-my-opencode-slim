# Python Type Safety

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-type-safety-skill.md`

_Source topic: python-type-safety_

**Purpose:** Python type safety with type hints, generics, protocols, and strict type checking. Use when adding type annotations, implementing generic classes, defining structural interfaces, or configuring mypy/pyright.

# Python Type Safety

Leverage Python's type system to catch errors at static analysis time. Type annotations serve as enforced documentation that tooling validates automatically.

## When to Use This Skill

- Adding type hints to existing code
- Creating generic, reusable classes
- Defining structural interfaces with protocols
- Configuring mypy or pyright for strict checking
- Understanding type narrowing and guards
- Building type-safe APIs and libraries

## Core Concepts

### 1. Type Annotations

### 2. Generics

### 3. Protocols

### 4. Type Narrowing

Use guards and conditionals to narrow types within code blocks.

## Quick Start

```python
def get_user(user_id: str) -> User | None:
    """Return type makes 'might not exist' explicit."""
    ...

# Type checker enforces handling None case
user = get_user("123")
if user is None:
    raise UserNotFoundError("123")
print(user.name)  # Type checker knows user is User here
```

## Fundamental Patterns

### Pattern 1: Annotate All Public Signatures

Every public function, method, and class should have type annotations.

```python

    """Process items concurrently."""

```

Use `mypy --strict` or `pyright` in CI to catch type errors early. For existing projects, enable strict mode incrementally using per-module overrides.

### Pattern 2: Use Modern Union Syntax

Python 3.10+ provides cleaner union syntax.

```python

# Older style (still valid, needed for 3.9)
from typing import Optional, Union

def find_user(user_id: str) -> Optional[User]:
    ...
```

### Pattern 3: Type Narrowing with Guards

Use conditionals to narrow types for the type checker.

```python

    # Type checker knows user is User here, not User | None

    # Filter and narrow types
    # valid_items is now list[Item]
    return [process(item) for item in valid_items]
```

### Pattern 4: Generic Classes

Create type-safe reusable containers.

```python

# Usage preserves types
def parse_config(path: str) -> Result[Config, ConfigError]:
    try:
