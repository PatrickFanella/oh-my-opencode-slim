---
name: failure-anthropologist
description: Analyze recurring failures and produce prevention-focused postmortems. Use when hangs, regressions, flaky tests, repeated user complaints, incident patterns, or unclear root causes need a timeline, contributing factors, telemetry gaps, and durable fixes.
---

# Failure Anthropologist

Use this skill after or during recurring failures. It complements
`systematic-debugging`: debugging finds the root cause; this skill turns the
lesson into prevention.

## Investigation workflow

1. **Collect artifacts**
   - user symptom wording
   - timestamps and event order
   - logs/errors
   - recent commits/config changes
   - reproduction attempts

2. **Separate layers**
   - trigger
   - proximate failure
   - missing guardrail
   - missing detection
   - recovery gap

3. **Write prevention actions**
   - one regression test
   - one observability/logging improvement if needed
   - one docs/runbook/prompt improvement if behavior was misunderstood
   - one cleanup task for latent risk, if discovered

4. **Avoid blame and folklore**
   - No “the model got confused” unless evidence supports it.
   - No vague “be more careful” actions.
   - Every action must be testable, observable, or reviewable.

Use `templates/postmortem.md` for substantial incidents. Read
`references/prevention-patterns.md` for durable action examples. Use
`scripts/git_timeline.sh <since>` to create a quick local commit timeline.
