# Skill Evolution

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `skill-evolution-skill.md`

_Source topic: skill-evolution_

**Purpose:** Global evolution system for ship-faster skills. Uses hooks to capture context, failures, and session summaries, then generates patch suggestions (no auto edits) via skill-improver. Use when you want the skills to self-improve safely and continuously.

# Evolution

This skill makes the skills library evolve based on real development signals without auto-editing skills. The default output is a patch suggestion only.

## Why it exists (solving "too passive")

Default hooks can only "log events" without automatically consolidating experience into skills.

- At the end of each "big task", spend 60 seconds on Q&A confirmation: whether to optimize skills and which areas to prioritize
- When user chooses "yes to optimize", use `skill-improver` to generate **minimal patch suggestions** based on real run artifacts (still no auto-editing of skill library)

## Default strategy

- Capture context and failures into run artifacts
- Generate evolution candidates
- Use `skill-improver` to propose a minimal patch
- Human reviews and applies the patch

## Global hooks (recommended)

Example (merge into `~/.claude/settings.json` or `<project>/.claude/settings.json`):

## Evolution settings

```json
{
  "min_fail_count": 2,
  "ignore_tool_errors": true,
  "noise_filters": {
    "ignore_patterns": [
      "typescript: type.*already exists",
      "eslint:.*no-unused-vars.*react",
      "prettier:.*prettier-ignore"
    ],
    "max_failures_per_run": 20,
    "recent_only": true,
    "recent_window_minutes": 60
  },
  "output_format": {
    "summary_only": false,
    "include_context": true,
    "include_recent_failures": 20,
    "sort_by": "frequency"
...
```

...
