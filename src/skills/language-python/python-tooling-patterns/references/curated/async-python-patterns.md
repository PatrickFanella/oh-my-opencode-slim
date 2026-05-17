# Async Python Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `async-python-patterns-skill.md`

_Source topic: async-python-patterns_

**Purpose:** Master Python asyncio, concurrent programming, and async/await patterns for high-performance applications. Use when building async APIs, concurrent systems, or I/O-bound applications requiring non-blocking operations.

# async-python-patterns

Design and debug Python asyncio systems. Read the full guide only for detailed cancellation, task, queue, or testing patterns.

## Workflow

1. Use this skill only when the request matches the frontmatter description.
2. Keep the main context short: read only the relevant reference file for the exact subtask.
3. Prefer existing scripts/templates/assets in this skill before writing ad hoc code.
4. Stop and ask when required credentials, CLIs, project context, or user confirmation are missing.

## Resources

- `references/full-guide.md` — detailed guidance.


### From `full-guide.md`

_Source topic: async-python-patterns_

**Purpose:** Master Python asyncio, concurrent programming, and async/await patterns for high-performance applications. Use when building async APIs, concurrent systems, or I/O-bound applications requiring non-blocking operations.

# Async Python Patterns

Comprehensive guidance for implementing asynchronous Python applications using asyncio, concurrent programming patterns, and async/await for building high-performance, non-blocking systems.

## When to Use This Skill

- Building async web APIs (FastAPI, aiohttp, Sanic)
- Implementing concurrent I/O operations (database, file, network)
- Creating web scrapers with concurrent requests
- Developing real-time applications (WebSocket servers, chat systems)
- Processing multiple independent tasks simultaneously
- Building microservices with async communication
- Optimizing I/O-bound workloads
- Implementing async background tasks and queues

## Sync vs Async Decision Guide

Before adopting async, consider whether it's the right choice for your use case.

| Use Case | Recommended Approach |
|----------|---------------------|
| Many concurrent network/DB calls | `asyncio` |
| CPU-bound computation | `multiprocessing` or thread pool |
| Mixed I/O + CPU | Offload CPU work with `asyncio.to_thread()` |
| Simple scripts, few connections | Sync (simpler, easier to debug) |
| Web APIs with high concurrency | Async frameworks (FastAPI, aiohttp) |

**Key Rule:** Stay fully sync or fully async within a call path. Mixing creates hidden blocking and complexity.

## Core Concepts

### 1. Event Loop

- Single-threaded cooperative multitasking
- Schedules coroutines for execution
- Handles I/O operations without blocking
...

# Python 3.7+
asyncio.run(main())
```

## Fundamental Patterns

### Pattern 1: Basic Async/Await

```python

    result = await fetch_data("https://api.example.com")

```

### Pattern 2: Concurrent Execution with gather()

```python

```

### Pattern 3: Task Creation and Management

```python

    # Create tasks

    # Do other work

    # Wait for tasks

```

### Pattern 4: Error Handling in Async Code

```python

...

# Simulated async database client
class AsyncDB:
    """Simulated async database."""

    async def execute(self, query: str) -> List[dict]:
        """Execute query."""
        await asyncio.sleep(0.1)
        return [{"id": 1, "name": "Example"}]

        return {"id": 1, "name": "Example"}

```
