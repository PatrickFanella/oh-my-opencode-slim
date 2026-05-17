# Python Background Jobs

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-background-jobs-skill.md`

_Source topic: python-background-jobs_

**Purpose:** Python background job patterns including task queues, workers, and event-driven architecture. Use when implementing async task processing, job queues, long-running operations, or decoupling work from request/response cycles.

# Python Background Jobs & Task Queues

Decouple long-running or unreliable work from request/response cycles. Return immediately to the user while background workers handle the heavy lifting asynchronously.

## When to Use This Skill

- Processing tasks that take longer than a few seconds
- Sending emails, notifications, or webhooks
- Generating reports or exporting data
- Processing uploads or media transformations
- Integrating with unreliable external services
- Building event-driven architectures

## Core Concepts

### 1. Task Queue Pattern

API accepts request, enqueues a job, returns immediately with a job ID. Workers process jobs asynchronously.

### 2. Idempotency

### 3. Job State Machine

### 4. At-Least-Once Delivery

## Quick Start

```python
from celery import Celery

app = Celery("tasks", broker="redis://localhost:6379")

@app.task
def send_email(to: str, subject: str, body: str) -> None:
    # This runs in a background worker
    email_client.send(to, subject, body)

# In your API handler
send_email.delay("user@example.com", "Welcome!", "Thanks for signing up")
```

## Fundamental Patterns

### Pattern 1: Return Job ID Immediately

For operations exceeding a few seconds, return a job ID and process asynchronously.

```python

# API endpoint
async def start_export(request: ExportRequest) -> JobResponse:
    """Start export job and return job ID."""
    job_id = str(uuid4())

    # Persist job record
    await jobs_repo.create(Job(
        id=job_id,

    # Enqueue task for background processing

    # Return immediately with job ID
```

### Pattern 2: Celery Task Configuration

Configure Celery tasks with proper retry and timeout settings.

```python

# Global configuration
app.conf.update(
    task_time_limit=3600,          # Hard limit: 1 hour
    task_soft_time_limit=3000,      # Soft limit: 50 minutes
    task_acks_late=True,            # Acknowledge after completion
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,   # Don't prefetch too many tasks
)

    """Process payment with automatic retry on transient errors."""
        # Don't retry permanent failures
        # Retry with exponential backoff
```

### Pattern 3: Make Tasks Idempotent

Workers may retry on crash or timeout. Design for safe re-execution.

```python
