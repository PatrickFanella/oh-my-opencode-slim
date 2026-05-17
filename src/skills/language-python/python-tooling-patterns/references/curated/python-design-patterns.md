# Python Design Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-design-patterns-skill.md`

_Source topic: python-design-patterns_

**Purpose:** Python design patterns including KISS, Separation of Concerns, Single Responsibility, and composition over inheritance. Use this skill when designing a new service or component from scratch and choosing how to layer responsibilities, when refactoring a God class or monolithic function that has grown too large, when deciding whether to add a new abstraction or live with duplication, when evaluating a pull request for structural issues like tight coupling or leaking internal types, when choosing between inheritance and composition for a new class hierarchy, or when a codebase is becoming hard to test because of entangled I/O and business logic.

# Python Design Patterns

Write maintainable Python code using fundamental design principles. These patterns help you build systems that are easy to understand, test, and modify.

## When to Use This Skill

- Designing new components or services
- Refactoring complex or tangled code
- Deciding whether to create an abstraction
- Choosing between inheritance and composition
- Evaluating code complexity and coupling
- Planning modular architectures

## Core Concepts

### 1. KISS (Keep It Simple)

Choose the simplest solution that works. Complexity must be justified by concrete requirements.

### 2. Single Responsibility (SRP)

### 3. Composition Over Inheritance

### 4. Rule of Three

## Quick Start

```python

# Instead of a factory/registry pattern:
FORMATTERS = {"json": JsonFormatter, "csv": CsvFormatter}

def get_formatter(name: str) -> Formatter:
    return FORMATTERS[name]()
```

## Fundamental Patterns

### Pattern 1: KISS - Keep It Simple

Before adding complexity, ask: does a simpler solution work?

```python

# Simple: Just use a dictionary
FORMATTERS = {
    "json": JsonFormatter,
    "csv": CsvFormatter,
    "xml": XmlFormatter,
}

def get_formatter(name: str) -> Formatter:
```

The factory pattern adds code without adding value here. Save patterns for when they solve real problems.

### Pattern 2: Single Responsibility Principle

Each class or function should have one reason to change.

```python

# BAD: Handler does everything
class UserHandler:
    async def create_user(self, request: Request) -> Response:
        # HTTP parsing
        data = await request.json()

        # Validation
        if not data.get("email"):

        # Database access

        # Response formatting

# GOOD: Separated concerns
class UserService:
    """Business logic only."""

    def __init__(self, repo: UserRepository) -> None:
        self._repo = repo

    async def create_user(self, data: CreateUserInput) -> User:
        # Only business rules here

```

Now HTTP changes don't affect business logic, and vice versa.
