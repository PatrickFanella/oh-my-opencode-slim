# Skill Builder

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `scripts/skill-builder/`
- `templates/skill-builder/`

## Guidance

### From `skill-builder-skill.md`

_Source topic: skill-builder_

**Purpose:** Build new agent skills. Use when creating diagnostic frameworks, CLI tools, or data-driven generators that follow the established skill patterns.

# Skill Name: Subtitle

You [role description]. Your role is to [specific function].

## Core Principle
**Bold statement capturing diagnostic essence.**

## The States
### State X1: Name

## Diagnostic Process
1. Step one
2. Step two

## Key Questions
### For Category A
- Question?
- Question?

## Anti-Patterns
### The [Problem Name]

## Available Tools
### script.ts

## Example Interaction
1. Action
2. Action

## What You Do NOT Do
- List of boundaries
- Things the skill never does

## Integration Graph

### Inbound (From Other Skills)
...

# Preview without writing
deno run --allow-read scripts/scaffold.ts skill-name --dry-run
```

### validate-skill.ts
Checks skill completeness and pattern conformance.

```bash

# JSON output for CI
deno run --allow-read scripts/validate-skill.ts ../conlang --json
```

## Anti-Patterns

### The Feature List Skill
**Problem:** Skill is a list of things it can do, not a diagnostic framework.
**Fix:** Restructure around problem states. What are users stuck on?

### The Kitchen Sink
**Problem:** Skill tries to do too much, covers multiple problem domains.
**Fix:** Split into focused skills. One skill = one diagnostic space.

### The Script Without Skill
**Problem:** Script exists but no SKILL.md explains when to use it.
**Fix:** Every script belongs to a skill with documented purpose.

### The Orphan Skill
**Problem:** Skill doesn't reference or get referenced by other skills.
**Fix:** Add integration section. Map state transitions to/from other skills.
...
```bash
```

## Output Persistence

This skill writes primary output to files so work persists across sessions.

### Output Discovery

**Before doing any other work:**

1. Check for `context/output-config.md` in the project
2. If found, look for this skill's entry
3. If not found or no entry for this skill, **ask the user first**:
   - "Where should I save output from this skill-builder session?"
   - Suggest: `skills/{cluster}/{skill-name}/` as the standard skill location
4. Store the user's preference:
   - In `context/output-config.md` if context network exists
   - In `.skill-builder-output.md` at project root otherwise

### From `SKILL.template.md`

_Source topic: {{SKILL_NAME}}_

**Purpose:** {{DESCRIPTION}}

# {{SKILL_TITLE}}: {{SUBTITLE}}

You {{ROLE_DESCRIPTION}}. Your role is to {{SPECIFIC_FUNCTION}}.

## Core Principle

**{{CORE_PRINCIPLE}}**

## Quick Reference

Use this skill when:
- {{QUICK_REFERENCE_USE_CASE_1}}
- {{QUICK_REFERENCE_USE_CASE_2}}

- **{{PREFIX}}1:** {{STATE_1_NAME}} - {{STATE_1_BRIEF}}
- **{{PREFIX}}2:** {{STATE_2_NAME}} - {{STATE_2_BRIEF}}
- **{{PREFIX}}3:** {{STATE_3_NAME}} - {{STATE_3_BRIEF}}

## The States

### State {{PREFIX}}1: {{STATE_1_NAME}}

### State {{PREFIX}}2: {{STATE_2_NAME}}

### State {{PREFIX}}3: {{STATE_3_NAME}}

## Diagnostic Process

When a writer presents a {{DOMAIN}} problem:

1. **Listen for symptoms** - What specifically feels wrong?
2. **Identify the state** - Match symptoms to states above
3. **Ask key questions** - Gather information needed for diagnosis
4. **Recommend intervention** - Point to specific framework/tool
5. **Suggest first step** - What's the minimal viable fix?

## Key Questions
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: skill-builder
Source path: `skills/agent-ecosystem/skill-builder`
Canonical skill: `skills/agent-ecosystem/skill-creator`

### From `output-section.md`

_Source topic: output-section_

# Output Persistence Section Template

Add this section to SKILL.md files, customizing the skill-specific content.

## Skill-Type Examples

### For Diagnostic Skills

```markdown
### Primary Output

For this skill, persist:
- Diagnosed state with evidence
- Recommended interventions
- Action items and next steps

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| State diagnosis and evidence | Clarifying questions |
| Intervention recommendations | Discussion of options |
| Action items | Follow-up questions |

### File Naming

Pattern: `{project}-{skill}-{date}.md`
...
```

### For Generative Skills

```markdown
### Primary Output

For this skill, persist:
- Generated ideas and alternatives
- Constraints explored and axis rotations
- Selected/promising options with rationale

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| Final/selected ideas | Iteration process |
| Evaluation criteria used | Discarded options |
| Promising combinations | Real-time feedback |

### File Naming

Pattern: `{topic}-{date}.md`
...
```

### For Research Skills
...
