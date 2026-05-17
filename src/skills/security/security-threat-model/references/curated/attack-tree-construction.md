# Attack Tree Construction

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `attack-tree-construction-skill.md`

_Source topic: attack-tree-construction_

**Purpose:** Build comprehensive attack trees to visualize threat paths. Use when mapping attack scenarios, identifying defense gaps, or communicating security risks to stakeholders.

# Attack Tree Construction

Systematic attack path visualization and analysis.

## When to Use This Skill

- Visualizing complex attack scenarios
- Identifying defense gaps and priorities
- Communicating risks to stakeholders
- Planning defensive investments
- Penetration test planning
- Security architecture review

## Core Concepts

### 1. Attack Tree Structure

```
                    [Root Goal]
                         |
            ┌────────────┴────────────┐
            │                         │
       [Sub-goal 1]              [Sub-goal 2]
       (OR node)                 (AND node)
            │                         │
      ┌─────┴─────┐             ┌─────┴─────┐
      │           │             │           │
   [Attack]   [Attack]      [Attack]   [Attack]
    (leaf)     (leaf)        (leaf)     (leaf)
```

### 2. Node Types

| Type     | Symbol    | Description             |
| -------- | --------- | ----------------------- |
| **OR**   | Oval      | Any child achieves goal |
...

# Example usage
def build_account_takeover_tree() -> AttackTree:
    """Build attack tree for account takeover scenario."""
    return (
        AttackTreeBuilder("Account Takeover", "Gain unauthorized access to user account")
        .goal("G1", "Take Over User Account")

        .or_node("S1", "Steal Credentials")

                mitigations=["Security testing", "Code review", "WAF"]

```

### Template 3: Mermaid Diagram Generator

```python

        # Node shape based on type
            # Color based on difficulty

```

### Template 4: Attack Path Analysis

```python

            # Each child is a separate path
            # Must combine all children

            # Combine paths from all AND children

        # Cartesian product of all child path combinations

            "steps": len(leaves),

```

## Best Practices

### Do's

- **Start with clear goals** - Define what attacker wants
- **Be exhaustive** - Consider all attack vectors
- **Attribute attacks** - Cost, skill, and detection
- **Update regularly** - New threats emerge
- **Validate with experts** - Red team review

### Don'ts

- **Don't oversimplify** - Real attacks are complex

### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: attack-tree-construction
Source path: `skills/security/attack-tree-construction`
Canonical skill: `skills/security/security-threat-model`
