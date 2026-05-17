# Python Resilience

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-resilience-skill.md`

_Source topic: python-resilience_

**Purpose:** Python resilience patterns including automatic retries, exponential backoff, timeouts, and fault-tolerant decorators. Use when adding retry logic, implementing timeouts, building fault-tolerant services, or handling transient failures.

# Python Resilience Patterns

Build fault-tolerant Python applications that gracefully handle transient failures, network issues, and service outages. Resilience patterns keep systems running when dependencies are unreliable.

## When to Use This Skill

- Adding retry logic to external service calls
- Implementing timeouts for network operations
- Building fault-tolerant microservices
- Handling rate limiting and backpressure
- Creating infrastructure decorators
- Designing circuit breakers

## Core Concepts

### 1. Transient vs Permanent Failures

### 2. Exponential Backoff

### 3. Jitter

Add randomness to backoff to prevent thundering herd when many clients retry simultaneously.

### 4. Bounded Retries

## Quick Start

```python
from tenacity import retry, stop_after_attempt, wait_exponential_jitter

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
)
def call_external_service(request: dict) -> dict:
    return httpx.post("https://api.example.com", json=request).json()
```

## Fundamental Patterns
...

# Define what's retryable
RETRYABLE_EXCEPTIONS = (
    ConnectionError,
    TimeoutError,
    httpx.ConnectTimeout,
    httpx.ReadTimeout,
)

```

### Pattern 3: HTTP Status Code Retries

Retry specific HTTP status codes that indicate transient issues.

```python

```

### Pattern 4: Combined Exception and Status Retry

Handle both network exceptions and HTTP status codes.

```python

```

## Advanced Patterns

### Pattern 5: Logging Retry Attempts

Track retry behavior for debugging and alerting.

```python

```

### Pattern 6: Timeout Decorator

Create reusable timeout decorators for consistent timeout handling.

```python
...

# Stack multiple concerns
@traced("fetch_user_data")
@with_timeout(30)
@retry(stop=stop_after_attempt(3), wait=wait_exponential_jitter())
