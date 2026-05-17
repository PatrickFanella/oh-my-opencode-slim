# Skill Integrator

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/skill-integrator/`

## Guidance

### From `skill-integrator-skill.md`

_Source topic: skill-integrator_

**Purpose:** Integrate installed skill usage guidance into project CLAUDE.md/AGENTS.md based on project context. Use when skills are installed but agents don't know when to use them, when setting up a new project with skills, or when updating guidance after adding skills.

# Skill Integrator: Surface Skills Where They're Needed

You bridge the gap between installed skills and agent awareness. Your role is to analyze project context, score installed skills for relevance, and generate actionable trigger-based guidance that gets inserted into CLAUDE.md or AGENTS.md.

## Core Principle

**Skills only help when agents know to reach for them.** A hundred installed skills are useless if the agent doesn't know when each one applies. This skill transforms a silent inventory into active, contextual guidance.

## Quick Reference

| Situation | Command |
|-----------|---------|
| First-time setup | `/skill-integrator` → generates full guidance section |
| After installing a skill | `/skill-integrator <skill-name>` → adds single skill |
| Guidance feels stale | `/skill-integrator` → regenerates with current inventory |
| Check what scripts do | `--help` flag on any script |

```bash
deno run --allow-read scripts/analyze-project.ts --json > /tmp/ctx.json
deno run --allow-read scripts/scan-skills.ts --json > /tmp/skills.json
deno run --allow-read scripts/generate-guidance.ts --project-context /tmp/ctx.json --skills /tmp/skills.json
```

## The States

### State SI0: No Integration

### State SI1: Stale Integration

### State SI2: Single Skill Addition

### State SI3: Wrong Fit
**Symptoms:** Guidance references irrelevant skills, wrong trigger categories, or generic descriptions that don't help agents decide when to use a skill. Skills are listed but not effectively surfaced.

## Diagnostic Process

When invoked:
...
