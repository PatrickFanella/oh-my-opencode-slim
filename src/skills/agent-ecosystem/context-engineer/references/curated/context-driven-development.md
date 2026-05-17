# Context Driven Development

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `context-driven-development-skill.md`

_Source topic: context-driven-development_

**Purpose:** >-

# Context-Driven Development

Guide for implementing and maintaining context as a managed artifact alongside code, enabling consistent AI interactions and team alignment through structured project documentation.

## When to Use This Skill

- Setting up new projects with Conductor
- Understanding the relationship between context artifacts
- Maintaining consistency across AI-assisted development sessions
- Onboarding team members to an existing Conductor project
- Deciding when to update context documents
- Managing greenfield vs brownfield project contexts

## Core Philosophy

Key principles:

1. **Context precedes code**: Define what you're building and how before implementation
2. **Living documentation**: Context artifacts evolve with the project
3. **Single source of truth**: One canonical location for each type of information
4. **AI alignment**: Consistent context produces consistent AI behavior

## The Workflow

Follow the **Context → Spec & Plan → Implement** workflow:

1. **Context Phase**: Establish or verify project context artifacts exist and are current
2. **Specification Phase**: Define requirements and acceptance criteria for work units
3. **Planning Phase**: Break specifications into phased, actionable tasks
4. **Implementation Phase**: Execute tasks following established workflow patterns

## Artifact Relationships

### product.md - Defines WHAT and WHY

- Product name and one-line description
...


### From `artifact-templates.md`

_Source topic: artifact-templates_

# Tech Stack

## Languages & Frameworks

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12 | Backend API |
| React | 18.x | Frontend UI |

## Key Dependencies

| Package | Version | Rationale |
|---|---|---|
| FastAPI | 0.100+ | REST API framework |
| SQLAlchemy | 2.x | ORM and database access |

## Infrastructure

| Component | Choice | Notes |
|---|---|---|
| Hosting | AWS ECS | Production containers |
| Database | PostgreSQL 16 | Primary data store |
| CI/CD | GitHub Actions | Build and deploy |

## Dev Tools

| Tool | Purpose | Config |
|---|---|---|
| pytest | Testing (target: 80% coverage) | pyproject.toml |
| ruff | Linting + formatting | ruff.toml |
```

## workflow.md

```markdown

# Workflow

## Methodology

TDD with trunk-based development.

## Git Conventions

- **Branch naming**: `feature/<track-id>-description`
- **Commit format**: `type(scope): message`
- **PR requirements**: 1 approval, all checks green

## Quality Gates

| Gate | Requirement |
|---|---|
| Tests | All pass, coverage >= 80% |
| Lint | Zero errors |
| Review | At least 1 approval |
| Types | No type errors |

## Deployment

1. PR merged to main
2. CI runs tests + build
3. Auto-deploy to staging
4. Manual promotion to production
```

## tracks.md

```markdown

# Product Guidelines

## Voice & Tone

- Professional but approachable
- Direct and concise
- Technical where needed, plain language by default

## Terminology

| Term | Use | Don't Use |
|---|---|---|
| workspace | preferred | project, repo |
| track | preferred | ticket, issue |

## Error Messages

Example: `[Auth] Session expired. Please sign in again.`
```
