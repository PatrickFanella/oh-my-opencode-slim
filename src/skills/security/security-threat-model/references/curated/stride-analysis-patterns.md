# Stride Analysis Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `stride-analysis-patterns-skill.md`

_Source topic: stride-analysis-patterns_

**Purpose:** Apply STRIDE methodology to systematically identify threats. Use when analyzing system security, conducting threat modeling sessions, or creating security documentation.

# STRIDE Analysis Patterns

Systematic threat identification using the STRIDE methodology.

## When to Use This Skill

- Starting new threat modeling sessions
- Analyzing existing system architecture
- Reviewing security design decisions
- Creating threat documentation
- Training teams on threat identification
- Compliance and audit preparation

## Core Concepts

### 1. STRIDE Categories

```
S - Spoofing       → Authentication threats
T - Tampering      → Integrity threats
R - Repudiation    → Non-repudiation threats
I - Information    → Confidentiality threats
    Disclosure
D - Denial of      → Availability threats
    Service
E - Elevation of   → Authorization threats
    Privilege
```

### 2. Threat Analysis Matrix

| Category            | Question                                  | Control Family |
| ------------------- | ----------------------------------------- | -------------- |
| **Spoofing**        | Can attacker pretend to be someone else?  | Authentication |
| **Tampering**       | Can attacker modify data in transit/rest? | Integrity      |
| **Repudiation**     | Can attacker deny actions?                | Logging/Audit  |
...

# Threat Model: [System Name]

## 1. System Overview

### 1.1 Description

[Brief description of the system and its purpose]

### 1.2 Data Flow Diagram
```

[User] --> [Web App] --> [API Gateway] --> [Backend Services]
|
v
[Database]

```

### 1.3 Trust Boundaries
- **External Boundary**: Internet to DMZ
- **Internal Boundary**: DMZ to Internal Network
- **Data Boundary**: Application to Database

## 2. Assets

| Asset | Sensitivity | Description |
|-------|-------------|-------------|
| User Credentials | High | Authentication tokens, passwords |
| Personal Data | High | PII, financial information |
| Session Data | Medium | Active user sessions |
| Application Logs | Medium | System activity records |
| Configuration | High | System settings, secrets |

## 3. STRIDE Analysis

### 3.1 Spoofing Threats
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: stride-analysis-patterns
Source path: `skills/quality-review/stride-analysis-patterns`
Canonical skill: `skills/security/security-threat-model`
