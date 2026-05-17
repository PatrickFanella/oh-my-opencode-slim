# Security Requirement Extraction

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `security-requirement-extraction-skill.md`

_Source topic: security-requirement-extraction_

**Purpose:** Derive security requirements from threat models and business context. Use when translating threats into actionable requirements, creating security user stories, or building security test cases.

# Security Requirement Extraction

Transform threat analysis into actionable security requirements.

## When to Use This Skill

- Converting threat models to requirements
- Writing security user stories
- Creating security test cases
- Building security acceptance criteria
- Compliance requirement mapping
- Security architecture documentation

## Core Concepts

### 1. Requirement Categories

```
Business Requirements → Security Requirements → Technical Controls
         ↓                       ↓                      ↓
  "Protect customer    "Encrypt PII at rest"   "AES-256 encryption
   data"                                        with KMS key rotation"
```

### 2. Security Requirement Types

| Type               | Focus                   | Example                               |
| ------------------ | ----------------------- | ------------------------------------- |
| **Functional**     | What system must do     | "System must authenticate users"      |
| **Non-functional** | How system must perform | "Authentication must complete in <2s" |
| **Constraint**     | Limitations imposed     | "Must use approved crypto libraries"  |

### 3. Requirement Attributes

| Attribute        | Description                 |
| ---------------- | --------------------------- |
...

# Security Epic: {domain.value.replace('_', ' ').title()}

## Overview
This epic covers all security requirements related to {domain.value.replace('_', ' ')}.

## Business Value
- Protect against {domain.value.replace('_', ' ')} related threats
- Meet compliance requirements
- Reduce security risk

## Stories in this Epic

## Acceptance Criteria
- All stories complete
- Security tests passing
- Security review approved
- Compliance requirements met

## Risk if Not Implemented
- Vulnerability to {domain.value.replace('_', ' ')} attacks
- Compliance violations
- Potential data breach

## Dependencies
```

## Best Practices

### Do's

- **Trace to threats** - Every requirement should map to threats
- **Be specific** - Vague requirements can't be tested
- **Include acceptance criteria** - Define "done"
- **Consider compliance** - Map to frameworks early
- **Review regularly** - Requirements evolve with threats

### Don'ts

- **Don't be generic** - "Be secure" is not a requirement
- **Don't skip rationale** - Explain why it matters
- **Don't ignore priorities** - Not all requirements are equal
- **Don't forget testability** - If you can't test it, you can't verify it
- **Don't work in isolation** - Involve stakeholders


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: security-requirement-extraction
Source path: `skills/security/security-requirement-extraction`
Canonical skill: `skills/security/security-threat-model`
