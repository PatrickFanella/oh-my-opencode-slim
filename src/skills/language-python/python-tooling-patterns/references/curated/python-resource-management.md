# Python Resource Management

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-resource-management-skill.md`

_Source topic: python-resource-management_

**Purpose:** Python resource management with context managers, cleanup patterns, and streaming. Use when managing connections, file handles, implementing cleanup logic, or building streaming responses with accumulated state.

# Python Resource Management

Manage resources deterministically using context managers. Resources like database connections, file handles, and network sockets should be released reliably, even when exceptions occur.

## When to Use This Skill

- Managing database connections and connection pools
- Working with file handles and I/O
- Implementing custom context managers
- Building streaming responses with state
- Handling nested resource cleanup
- Creating async context managers

## Core Concepts

### 1. Context Managers

### 2. Protocol Methods

`__enter__`/`__exit__` for sync, `__aenter__`/`__aexit__` for async resource management.

### 3. Unconditional Cleanup

### 4. Exception Handling

## Quick Start

```python
from contextlib import contextmanager

@contextmanager
def managed_resource():
    resource = acquire_resource()
    try:
        yield resource
    finally:
        resource.cleanup()

with managed_resource() as r:
    r.do_work()
```

## Fundamental Patterns
...

# Manual management when needed
db = DatabaseConnection(dsn)
db.connect()
try:
    result = db.execute(query)
finally:
    db.close()
```

### Pattern 2: Async Context Manager

For async resources, implement the async protocol.

```python

# Usage
async with AsyncDatabasePool(dsn) as pool:
    users = await pool.execute("SELECT * FROM users WHERE active = $1", True)
```

### Pattern 3: Using @contextmanager Decorator

Simplify context managers with the decorator for straightforward cases.

```python

# Usage
async with database_transaction(conn) as tx:
    await tx.execute("INSERT INTO users ...")
    await tx.execute("INSERT INTO audit_log ...")
```

### Pattern 4: Unconditional Resource Release

Always clean up resources in `__exit__`, regardless of exceptions.

```python
    """Process file with guaranteed cleanup."""

        # Close main file

        # Clean up any temporary files

        # Return None/False to propagate any exception
