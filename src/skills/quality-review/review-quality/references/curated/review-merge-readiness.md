# Review Merge Readiness

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `review-merge-readiness-skill.md`

_Source topic: review-merge-readiness_

**Purpose:** Request/execute structured code review: use after completing important tasks, at end of each execution batch, or before merge. Based on git diff range, compare against plan and requirements, output issue list by Critical/Important/Minor severity, and provide clear verdict on merge readiness. Trigger words: request code review, PR review, merge readiness, production readiness.

# Requesting Code Review (Structured Review: Requirements Alignment + Production Readiness)

Goal: Make code review a repeatable process, not random comments.

**Core principle: Review early, review often.**

## When Review is Required

- After completing important features
- After each batch in `workflow-execute-plans` ends (default 3 tasks per batch)
- Before merging to main branch

- When stuck (get a fresh perspective)
- Before major refactoring (establish baseline first)
- After fixing complex bugs (verify no new regressions)

## How to Initiate (Minimum Information Set)

### 1) Determine Review Scope (git SHA)

```bash

# Common approach: use main as baseline
BASE_SHA=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)
HEAD_SHA=$(git rev-parse HEAD)
```

If you want to review just the most recent commit within a small task:

```bash
```

### 2) Prepare Review Basis (Plan / Requirements)

Review must provide:
- **WHAT_WAS_IMPLEMENTED**: What you just completed (1-3 bullet points)
- **PLAN_OR_REQUIREMENTS**: Corresponding plan excerpt or requirements document path (e.g., `run_dir/03-plans/feature-plan.md`)

### 3) Get diff (Evidence)

```bash
```

## Review Execution Methods (Choose One)

### Method A: Sub-Agent Review (if your system supports it)

Use template: `review-merge-readiness/code-reviewer.md`, fill in placeholders and execute.

### Method B: Self Review (works without sub-agent)

Check each item per template checklist and output same structured result (Strengths + Issues by severity + Verdict).

## Review Output Format (Must Be Structured)

Output must include:
- **Strengths**: Specific positives (at least 1)
- **Issues**: Categorized by severity:
  - **Critical (Must Fix)**: Security/data loss/functionality bugs/would cause production incidents
  - **Important (Should Fix)**: Obviously poor architecture/missing error handling/test gaps/requirements misalignment
...


### From `code-reviewer.md`

_Source topic: code-reviewer_

# Code Review Agent (Template)

You are conducting a structured "merge-ready/production-ready" code review.

**Your Task:**
1. Read {WHAT_WAS_IMPLEMENTED}
2. Compare against {PLAN_OR_REQUIREMENTS} (or its path) to check compliance
3. Review code quality, architecture, testing, risks
4. Output issues by severity level
5. Provide clear verdict: ready to merge or not

## What Was Implemented

## Plan / Requirements

## Git Range to Review

```bash
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}
```

## Review Checklist

**Requirements / Spec:**
- Does it satisfy the plan/requirements? Are any acceptance criteria missed?
- Is there scope creep (major changes outside the plan)?
- Are there breaking changes? Is the migration plan documented and clear?

- Are responsibility boundaries clear? (modules/functions/components)
- Is error handling robust? Are there silent failures?
- Is type safety sufficient? (for TS/Go/Rust)
- Is there obvious duplication, over-abstraction, or YAGNI?
- Are edge cases handled? (null, exceptions, timeout, concurrency)

- Are design decisions reasonable? Is it extensible?
...
