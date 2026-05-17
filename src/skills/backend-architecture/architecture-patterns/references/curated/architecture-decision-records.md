# Architecture Decision Records

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `architecture-decision-records-skill.md`

_Source topic: architecture-decision-records_

**Purpose:** Write and maintain Architecture Decision Records (ADRs) following best practices for technical decision documentation. Use when documenting significant technical decisions, reviewing past architectural choices, or establishing decision processes.

# Architecture Decision Records

Comprehensive patterns for creating, maintaining, and managing Architecture Decision Records (ADRs) that capture the context and rationale behind significant technical decisions.

## When to Use This Skill

- Making significant architectural decisions
- Documenting technology choices
- Recording design trade-offs
- Onboarding new team members
- Reviewing historical decisions
- Establishing decision-making processes

## Core Concepts

### 1. What is an ADR?

An Architecture Decision Record captures:

- **Context**: Why we needed to make a decision
- **Decision**: What we decided
- **Consequences**: What happens as a result

### 2. When to Write an ADR

| Write ADR                  | Skip ADR               |
| -------------------------- | ---------------------- |
| New framework adoption     | Minor version upgrades |
| Database technology choice | Bug fixes              |
| API design patterns        | Implementation details |
| Security architecture      | Routine maintenance    |
| Integration patterns       | Configuration changes  |

### 3. ADR Lifecycle

```
Proposed → Accepted → Deprecated → Superseded
              ↓
           Rejected
```

## Templates
...

# ADR-0001: Use PostgreSQL as Primary Database

## Status

Accepted

## Context

- ~10,000 concurrent users
- Complex product catalog with hierarchical categories
- Transaction processing for orders and payments
- Full-text search for products
- Geospatial queries for store locator

## Decision Drivers

- **Must have ACID compliance** for payment processing
- **Must support complex queries** for reporting
- **Should support full-text search** to reduce infrastructure complexity
- **Should have good JSON support** for flexible product attributes
- **Team familiarity** reduces onboarding time

## Considered Options

### Option 1: PostgreSQL

- **Pros**: ACID compliant, excellent JSON support (JSONB), built-in full-text
- **Cons**: Slightly more complex replication setup than MySQL

### Option 2: MySQL

- **Pros**: Very familiar to team, simple replication, large community
- **Cons**: Weaker JSON support, no built-in full-text search (need

### Option 3: MongoDB

- **Pros**: Flexible schema, native JSON, horizontal scaling
...

# ADR-0012: Adopt TypeScript for Frontend Development

**Status**: Accepted
**Date**: 2024-01-15
**Deciders**: @alice, @bob, @charlie
