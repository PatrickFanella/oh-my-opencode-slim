# Context Network

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Extracted Resources

- `templates/context-network/`

## Guidance

### From `context-network-skill.md`

_Source topic: context-network_

**Purpose:** Bootstrap, maintain, and evolve context networks across their full lifecycle. Use when starting a new project, when existing documentation feels scattered, or when agent effectiveness degrades due to missing context.

# Context Network Lifecycle

You help users build and maintain context networks—structured frameworks for organizing project knowledge that persist across sessions and support both human and agent work. Your role is to diagnose context network state, generate appropriate scaffolding, and coach users on content decisions.

## Core Principle

**Context networks make relationships explicit.** Implicit knowledge doesn't survive session boundaries. Structure enables discovery. The goal is not completeness but navigability.

## Quick Reference

Use this skill when:
- Starting a new project that needs persistent context
- Existing documentation feels scattered or hard to navigate
- Agent effectiveness is degrading due to missing context
- Context-retrospective identified gaps to address

- **CN0:** No Network - Project has no context network
- **CN1:** Scattered Docs - Documentation exists but isn't organized as a network
- **CN2:** Siloed Structure - Structure exists but connections missing
- **CN3:** Navigation Broken - Connections exist but hard to traverse
- **CN4:** Guidance Unclear - Structure works but agent instructions fail
- **CN5:** Relationships Missing - Impacts/dependencies undocumented
- **CN6:** Maintenance Failing - Network exists but drifts from reality

## Operational Modes

### Bootstrap Mode (CN0/CN1 → CN2)

Use when starting fresh or organizing scattered documentation.

**Process:**

#### 1. Existing Documentation Scan

- `README.md`, `docs/`, `documentation/`
- Architecture decision records (ADRs, `adr/`, `decisions/`)
...


### From `creative-project.md`

_Source topic: creative-project_

# Project Status

## Current State

Creative project initiated. Establishing core concepts.

## Active Work

- [ ] Define core premise
- [ ] Establish main characters
- [ ] Outline initial structure

## Project Phase

## Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| {{today}} | Project initiated | Core concepts in development |

## Creative Blockers

## Next Steps

1. {{Next creative task}}
2. {{Following task}}


### From `personal-knowledge.md`

_Source topic: personal-knowledge_

# Personal Knowledge Scaffold

Directory structure and initial content for personal knowledge management (PKM, second brain, digital garden).

## Directory Structure

```
context/
├── status.md              # Current focus, active projects
├── decisions.md           # System decisions
├── glossary.md            # Personal vocabulary, abbreviations
├── areas/                 # Life areas (ongoing responsibilities)
│   ├── index.md           # Area overview
│   └── [area]/            # e.g., health/, career/, finance/
├── projects/              # Active projects (with end dates)
│   ├── index.md           # Project list
│   └── [project]/         # Individual project context
├── resources/             # Reference material
│   ├── index.md           # Resource catalog
│   └── [topic]/           # Organized by subject
└── archive/               # Completed/inactive items
    ├── projects/          # Finished projects
    └── areas/             # Deprecated areas
```

## PARA Integration

| PARA Component | Location | Purpose |
|----------------|----------|---------|
| **P**rojects | `projects/` | Active work with deadlines |
| **A**reas | `areas/` | Ongoing responsibilities |
| **R**esources | `resources/` | Reference material |
| **A**rchive | `archive/` | Inactive items |

- `status.md` for current state across all areas
- `decisions.md` for system-level choices
...


### From `research-project.md`

_Source topic: research-project_

# Research Status

## Current State

Research project initiated. Establishing scope and methodology.

## Active Work

- [ ] Define research questions
- [ ] Identify initial sources
- [ ] Establish methodology

## Research Phase

## Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| {{today}} | Project initiated | Research scope being defined |

## Open Questions

## Blockers

{{Access issues, resource gaps, etc.}}


### From `software-project.md`

_Source topic: software-project_

# Software Project Scaffold

Directory structure and initial content for software development projects.

## Directory Structure

```
context/
├── status.md              # Current state, active work
├── decisions.md           # Architecture decisions
├── glossary.md            # Domain vocabulary, conventions
├── architecture/          # System design
│   ├── overview.md        # High-level architecture
│   └── [component].md     # Per-component details
├── domains/               # Domain-specific context
│   ├── [domain-1]/        # e.g., api/, frontend/, data/
│   └── [domain-2]/
└── processes/             # Development workflows
    ├── development.md     # Dev workflow, local setup
    ├── deployment.md      # Deploy process
    └── testing.md         # Test strategy
```

## Common Domains

| Project Type | Typical Domains |
|--------------|-----------------|
| Full-stack web | `api/`, `frontend/`, `database/`, `infra/` |
| CLI tool | `core/`, `commands/`, `config/` |
| Library | `core/`, `api/`, `examples/` |
| Microservices | `services/`, `shared/`, `infra/` |
| Mobile app | `app/`, `api/`, `assets/` |

## Initial File Content

### status.md
...

# Project Status

## Current State

Project initialized. Context network established.

## Active Work

- [ ] Initial project setup
- [ ] Define core architecture

## Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| {{today}} | Context network created | Persistent context now available |

## Next Steps

1. Document initial architecture decisions
2. Set up development workflow


### From `decisions.md`

_Source topic: decisions_

# decisions.md Template

Track significant decisions and their rationale. Prevents re-litigating settled questions.

## Architecture Decisions

### {{Decision Title}}
**Date:** {{YYYY-MM-DD}}

**Context:** {{Why this decision was needed. 1-2 sentences.}}

**Decision:** {{What was decided. Be specific.}}

- {{Positive consequence}}
- {{Tradeoff accepted}}

## Process Decisions

### {{Process Decision Title}}

**Decision:** {{What process/workflow was established}}

## Usage Notes

- **Granularity**: Not every choice needs recording. Focus on decisions you'd explain to a new team member.
- **Status tracking**: Mark decisions as Superseded when they're replaced—don't delete history.
- **Revisit Queue**: Captures "we'll do X for now but reconsider when Y"—prevents forgotten technical debt.
- **Integration**: Link to relevant context files when decisions affect specific domains.


### From `discovery-file.md`

_Source topic: discovery-file_

# .context-network.md Template

Use this template to create the discovery file at your project root.

## Customization Notes

Replace:
- `{{PROJECT_NAME}}` with your project name
- Add project-specific navigation links as the network grows
- Extend "What Belongs Here" table with project-specific examples

# .context-network.md Template
Use this template to create the discovery file at your project root.
## Customization Notes
Replace:
- `{{PROJECT_NAME}}` with your project name
- Add project-specific navigation links as the network grows
- Extend "What Belongs Here" table with project-specific examples

### From `glossary.md`

_Source topic: glossary_

# glossary.md Template

Define project-specific vocabulary. Prevents agents from guessing at term meanings.

### {{Another Term}}
{{Definition}}

## Conventions

### Naming Conventions

- **Files:** {{pattern, e.g., kebab-case}}
- **Functions:** {{pattern}}
- **Variables:** {{pattern}}
- **Branches:** {{pattern, e.g., feature/ABC-123-description}}

### Code Conventions

- {{Convention 1: what and why}}
- {{Convention 2}}

## Usage Notes

- **Add terms as confusion arises**: Don't pre-populate exhaustively. Add when you notice agents or humans confused.
- **Context matters**: Same term may mean different things in different domains—capture that.
- **Link to sources**: For external/standard terms, link to authoritative definitions.
- **Conventions section**: Especially important for agents—explicit patterns prevent guessing.
