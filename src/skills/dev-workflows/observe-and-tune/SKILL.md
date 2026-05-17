---
name: observe-and-tune
description: Autonomous observation loop for monitoring and improving a running software system. Use when asked to observe, tune, monitor, or loop over a system to assess health, output quality, and goal alignment — then make surgical fixes. Triggers on "observe", "tune", "monitor system", "check health", or when paired with /loop for recurring checks.
---

# Observe and Tune

Run one observation cycle, or pair with `/loop` for recurring monitoring:

```
/observe-and-tune                    # one cycle now
/loop 60m /observe-and-tune          # every hour
```

## Cycle Protocol

### 1. Query recent activity (last 60 min)

Check active/completed work, recent outputs, system health. Identify: stuck processes, empty cycles, rate limits, errors. Assess throughput pace.

Use available tools: database queries, API calls, log inspection, file system checks.

### 2. Assess output quality

Read 2-3 most recent artifacts/outputs. Evaluate:

- Useful, concrete, moving toward project goals?
- Quality issues: empty responses, meta-commentary, circular patterns, errors?
- Doing real work or just talking about it?
- Getting better or worse vs previous cycles?

### 3. Report

Brief and structured:

- **One paragraph**: what happened, what was produced, quality assessment
- **Score 1-10**: goal alignment (10 = pure progress, 1 = spinning wheels)
- **Bottlenecks**: specific issues found, if any

### 4. Fix (only if needed)

Smallest change for biggest bottleneck:

- Adjust config, prompts, limits, or triggers via DB/config updates
- Code changes only if necessary — rebuild and redeploy only affected services
- Verify stability after any change

### 5. Log changes

Record what changed and why. Future cycles depend on this to avoid re-investigating solved problems or reverting fixes.

## Principles

- Fix one thing per cycle, not five. Observe the effect before changing more.
- Distinguish root causes. "System is broken" vs "output is bad" need different fixes.
- Check logs before guessing.
- Prefer config over code. Config is cheap, code requires rebuilds.
- Never change something you haven't read first.
- If nothing is wrong, say so and move on.
- Track cumulative changes. After several cycles, summarize all changes as a dev journal entry.
