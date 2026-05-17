# Threat Mitigation Mapping

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `threat-mitigation-mapping-skill.md`

_Source topic: threat-mitigation-mapping_

**Purpose:** Map identified threats to appropriate security controls and mitigations. Use when prioritizing security investments, creating remediation plans, or validating control effectiveness.

# Threat Mitigation Mapping

Connect threats to controls for effective security planning.

## When to Use This Skill

- Prioritizing security investments
- Creating remediation roadmaps
- Validating control coverage
- Designing defense-in-depth
- Security architecture review
- Risk treatment planning

## Core Concepts

### 1. Control Categories

```
Preventive ────► Stop attacks before they occur
   │              (Firewall, Input validation)
   │
Detective ─────► Identify attacks in progress
   │              (IDS, Log monitoring)
   │
Corrective ────► Respond and recover from attacks
                  (Incident response, Backup restore)
```

### 2. Control Layers

| Layer           | Examples                             |
| --------------- | ------------------------------------ |
| **Network**     | Firewall, WAF, DDoS protection       |
| **Application** | Input validation, authentication     |
| **Data**        | Encryption, access controls          |
| **Endpoint**    | EDR, patch management                |
...

# Threat Mitigation Report

## Executive Summary
- **Overall Risk Reduction:** {risk_reduction:.1f}%
- **Total Threats:** {len(self.plan.threats)}
- **Total Controls:** {len(self.plan.controls)}
- **Identified Gaps:** {len(gaps)}
- **Critical Gaps:** {len(critical_gaps)}

## Defense in Depth Coverage

## Critical Gaps Requiring Immediate Action

## Recommendations

## Implementation Roadmap

```

### Template 4: Control Effectiveness Testing

```python

# Control Effectiveness Test Report

## Summary
- **Total Tests:** {total}
- **Passed:** {passed}
- **Failed:** {total - passed}
- **Pass Rate:** {(passed/total)*100:.1f}%

## Results by Control
        # Group by control

```

## Best Practices

### Do's

- **Map all threats** - No threat should be unmapped
- **Layer controls** - Defense in depth is essential
- **Mix control types** - Preventive, detective, corrective
- **Track effectiveness** - Measure and improve
- **Review regularly** - Controls degrade over time

### Don'ts

- **Don't rely on single controls** - Single points of failure
- **Don't ignore cost** - ROI matters

### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: threat-mitigation-mapping
Source path: `skills/security/threat-mitigation-mapping`
Canonical skill: `skills/security/security-threat-model`
