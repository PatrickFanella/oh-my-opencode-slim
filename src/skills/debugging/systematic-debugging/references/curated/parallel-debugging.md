# Parallel Debugging

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `parallel-debugging-skill.md`

_Source topic: parallel-debugging_

**Purpose:** Debug complex issues using competing hypotheses with parallel investigation, evidence collection, and root cause arbitration. Use this skill when debugging bugs with multiple potential causes, performing root cause analysis, or organizing parallel investigation workflows.

# Parallel Debugging

Framework for debugging complex issues using the Analysis of Competing Hypotheses (ACH) methodology with parallel agent investigation.

## When to Use This Skill

- Bug has multiple plausible root causes
- Initial debugging attempts haven't identified the issue
- Issue spans multiple modules or components
- Need systematic root cause analysis with evidence
- Want to avoid confirmation bias in debugging

## Hypothesis Generation Framework

### 1. Logic Error

- Incorrect conditional logic (wrong operator, missing case)
- Off-by-one errors in loops or array access
- Missing edge case handling
- Incorrect algorithm implementation

### 2. Data Issue

- Invalid or unexpected input data
- Type mismatch or coercion error
- Null/undefined/None where value expected
- Encoding or serialization problem
- Data truncation or overflow

### 3. State Problem

- Race condition between concurrent operations
- Stale cache returning outdated data
- Incorrect initialization or default values
- Unintended mutation of shared state
- State machine transition error
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: parallel-debugging
Source path: `skills/debugging/parallel-debugging`
Canonical skill: `skills/debugging/systematic-debugging`

### From `hypothesis-testing.md`

_Source topic: hypothesis-testing_

# Hypothesis Testing Reference

Task templates, evidence formats, and arbitration decision trees for parallel debugging.

## Hypothesis Task Template

```markdown
## Hypothesis Investigation: {Hypothesis Title}

### Hypothesis Statement

{Clear, falsifiable statement about the root cause}

### Failure Mode Category

{Logic Error | Data Issue | State Problem | Integration Failure | Resource Issue | Environment}

### Investigation Scope

- Files to examine: {file list or directory}
- Related tests: {test files}
- Git history: {relevant date range or commits}

### Evidence Criteria

...
```

## Evidence Report Template

```markdown
## Investigation Report: {Hypothesis Title}

### Verdict: {Confirmed | Falsified | Inconclusive}

### Confidence: {High (>80%) | Medium (50-80%) | Low (<50%)}

### Confirming Evidence

1. `src/api/users.ts:47` — {description of what was found}
2. `src/middleware/auth.ts:23` — {description}

### Contradicting Evidence

1. `tests/api/users.test.ts:112` — {description of what contradicts}

### Causal Chain (if confirmed)

1. {First cause} →
...
```

## Arbitration Decision Tree
...
