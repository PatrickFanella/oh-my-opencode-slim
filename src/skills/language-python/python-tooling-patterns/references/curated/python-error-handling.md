# Python Error Handling

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-error-handling-skill.md`

_Source topic: python-error-handling_

**Purpose:** Python error handling patterns including input validation, exception hierarchies, and partial failure handling. Use when implementing validation logic, designing exception strategies, handling batch processing failures, or building robust APIs.

# Python Error Handling

Build robust Python applications with proper input validation, meaningful exceptions, and graceful failure handling. Good error handling makes debugging easier and systems more reliable.

## When to Use This Skill

- Validating user input and API parameters
- Designing exception hierarchies for applications
- Handling partial failures in batch operations
- Converting external data to domain types
- Building user-friendly error messages
- Implementing fail-fast validation patterns

## Core Concepts

### 1. Fail Fast

Validate inputs early, before expensive operations. Report all validation errors at once when possible.

### 2. Meaningful Exceptions

Use appropriate exception types with context. Messages should explain what failed, why, and how to fix it.

### 3. Partial Failures

### 4. Preserve Context

## Quick Start

```python
def fetch_page(url: str, page_size: int) -> Page:
    if not url:
        raise ValueError("'url' is required")
    if not 1 <= page_size <= 100:
        raise ValueError(f"'page_size' must be 1-100, got {page_size}")
    # Now safe to proceed...
```

## Fundamental Patterns
...

# Usage at API boundary
def export_data(data: list[dict], format_str: str) -> bytes:
    output_format = parse_output_format(format_str)  # Fail fast
    # Rest of function uses typed OutputFormat
    ...
```

### Pattern 3: Pydantic for Complex Validation

Use Pydantic models for structured input validation with automatic error messages.

```python

# Usage
try:
    user_input = CreateUserInput(
        email="user@example.com",
        name="john doe",
        age=25,
    )
except ValidationError as e:
    # Pydantic provides detailed error information
```

### Pattern 4: Map Errors to Standard Exceptions

Use Python's built-in exception types appropriately, adding context as needed.

| Failure Type | Exception | Example |
|--------------|-----------|---------|
| Invalid input | `ValueError` | Bad parameter values |
| Wrong type | `TypeError` | Expected string, got int |
| Missing item | `KeyError` | Dict key not found |
| Operational failure | `RuntimeError` | Service unavailable |
| Timeout | `TimeoutError` | Operation took too long |
| File not found | `FileNotFoundError` | Path doesn't exist |
| Permission denied | `PermissionError` | Access forbidden |

```python

# Avoid: Generic exception, no context
raise Exception("Invalid parameter")
```

## Advanced Patterns

### Pattern 5: Custom Exceptions with Context
