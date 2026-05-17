# Python Anti Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-anti-patterns-skill.md`

_Source topic: python-anti-patterns_

**Purpose:** Use this skill when reviewing Python code for common anti-patterns to avoid. Use as a checklist when reviewing code, before finalizing implementations, or when debugging issues that might stem from known bad practices.

# Python Anti-Patterns

Purpose: fast negative-checklist for Python review. Catch failure patterns before merge.

## Use When

- Reviewing PRs or refactors
- Debugging unclear runtime failures
- Hardening legacy Python code
- Coaching team on “what to avoid”

## Don’t Use When

- You need architecture design from scratch -> use `python-design-patterns`
- You need domain-specific security/compliance guidance

## Workflow

1. **Scan boundaries first**
   - API handlers, CLI entrypoints, jobs, async tasks.
2. **Run anti-pattern sweep by category**
   - Infrastructure, architecture, errors, resources, typing, tests.
3. **Mark each finding as**
   - `must-fix`, `should-fix`, `follow-up`.
4. **Patch highest-risk issues first**
   - Silent failures, secrets, retry storms, async blocking.
5. **Re-check with the quick checklist**
   - Ensure no regressions introduced while fixing.

## Review Checklist (Quick)

- [ ] Retry/timeout logic centralized (no duplicate retry layers)
- [ ] No hard-coded secrets or environment-specific values
- [ ] Public API does not leak internal ORM/protobuf types
- [ ] I/O separated from pure business logic
- [ ] No `except Exception: pass` or swallowed exceptions
...


### From `full-guide.md`

_Source topic: full-guide_

# Python Anti-Patterns Checklist (Full Guide)

Detailed reference of common Python anti-patterns, symptoms, and safer replacements.

## When to Use

- Pre-merge review for Python changes
- Incident/debug sessions where root cause is unclear
- Legacy cleanup and refactor planning
- Team enablement/checklist creation

## Infrastructure Anti-Patterns

### Scattered Timeout/Retry Logic

```python
def fetch_user(user_id):
    try:
        return requests.get(url, timeout=30)
    except Timeout:
        logger.warning("Timeout fetching user")
        return None
```

```python
@retry(stop=stop_after_attempt(3), wait=wait_exponential())
def http_get(url: str) -> Response:
    return requests.get(url, timeout=30)
```

### Double Retry

```python
@retry(max_attempts=3)
def call_service():
    return client.request()  # already retries internally
```

...
