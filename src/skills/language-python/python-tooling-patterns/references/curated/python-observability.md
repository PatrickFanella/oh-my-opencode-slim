# Python Observability

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-observability-skill.md`

_Source topic: python-observability_

**Purpose:** Python observability patterns including structured logging, metrics, and distributed tracing. Use when adding logging, implementing metrics collection, setting up tracing, or debugging production systems.

# Python Observability

Instrument Python applications with structured logs, metrics, and traces. When something breaks in production, you need to answer "what, where, and why" without deploying new code.

## When to Use This Skill

- Adding structured logging to applications
- Implementing metrics collection with Prometheus
- Setting up distributed tracing across services
- Propagating correlation IDs through request chains
- Debugging production issues
- Building observability dashboards

## Core Concepts

### 1. Structured Logging

### 2. The Four Golden Signals

### 3. Correlation IDs

### 4. Bounded Cardinality

## Quick Start

```python
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
)

logger = structlog.get_logger()
logger.info("Request processed", user_id="123", duration_ms=45)
```

## Fundamental Patterns
...

# Initialize at application startup
configure_logging("INFO")
logger = structlog.get_logger()
```

### Pattern 2: Consistent Log Fields

Every log entry should include standard fields for filtering and correlation.

```python

# Store correlation ID in context
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")

logger = structlog.get_logger()

def process_request(request: Request) -> Response:
    """Process request with structured logging."""
    logger.info(

```

### Pattern 3: Semantic Log Levels

Use log levels consistently across the application.

| Level | Purpose | Examples |
|-------|---------|----------|
| `DEBUG` | Development diagnostics | Variable values, internal state |
| `INFO` | Request lifecycle, operations | Request start/end, job completion |
| `WARNING` | Recoverable anomalies | Retry attempts, fallback used |
| `ERROR` | Failures needing attention | Exceptions, service unavailable |

```python

# ERROR: Failures requiring investigation
logger.error(
    "Payment processing failed",
    order_id=order.id,
    error=str(e),
    payment_provider="stripe",
)
```

Never log expected behavior at `ERROR`. A user entering a wrong password is `INFO`, not `ERROR`.

### Pattern 4: Correlation ID Propagation
