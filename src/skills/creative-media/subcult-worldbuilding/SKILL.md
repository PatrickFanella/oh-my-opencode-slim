---
name: subcult-worldbuilding
description: "Build SUBCULT's mythic layer: create agent identities, name sub-brands, design structural metaphors, define roles within the collective universe. Use when creating new agents, naming projects, designing governance structures, or expanding the SUBCULT world. Triggers: subcult agent, subcult naming, new agent identity, sub-brand, subcult lore, subcult worldbuilding, mythic structure."
---

> **See also:** `subcult-brand-voice` (writing in SUBCULT's voice), `subcult-visual-design` (visual/UI design in SUBCULT aesthetics).

# SUBCULT Worldbuilding

Expand the SUBCULT universe: agents, sub-brands, naming, governance rituals, and structural mythology. SUBCULT presents itself less like a company and more like a **mythic operating environment**.

## Why the mythic layer matters

The mythic layer does several things at once:
- Gives emotional and narrative cohesion to technical systems
- Turns infrastructure into worldbuilding
- Makes internal roles feel alive and memorable
- Differentiates from generic SaaS sludge
- Creates symbolic gravity without sacrificing practical function

This turns "an AI dashboard" into something closer to a theater, office, council, or ecosystem.

## Agent Identity Creation

Named agents are not just implementation details — they are branding architecture.

### What agents accomplish
1. **Personify systems** — abstract technical functions become memorable and emotionally legible
2. **Turn infrastructure into cast** — creates a world, not just a toolset
3. **Support modular identity** — each agent can have its own iconography, role, tone, and visual treatment
4. **Make governance feel lived-in** — proposal systems, mission loops, event trails gain symbolic meaning
5. **Strengthen brand depth** — the system feels like a living organism with factions, memory, and purpose

### Agent canonical files

Every SUBCULT agent is defined by a set of canonical files:

| File | Purpose |
|---|---|
| **Identity** | Role, personality, core purpose — the public face |
| **Soul** | Deeper values, philosophical orientation — the inner compass |
| **Bootstrap** | Instructions for initializing the agent from cold start |
| **Heartbeat** | The recurring operational loop — what the agent does continuously |
| **Memory** | Long-term persistent context — what the agent remembers across sessions |

When creating a new agent, create all five files. The identity is public-facing; the soul is internal guidance; the bootstrap is operational; the heartbeat defines the loop; memory accumulates over time.

### Agent design template

When creating a new agent identity:

```yaml
name: [Name]              # Short, evocative, often classical/mythic/technical
role: [Function]           # What this agent actually does (the legible inside)
title: [Symbolic title]    # How the agent presents itself (the symbolic outside)
personality:
  tone: [voice qualities]  # e.g., "precise, watchful, archival"
  stance: [orientation]    # e.g., "guardian", "investigator", "operator"
domain: [area of concern]  # e.g., "memory", "governance", "signal routing"
sigil: [description]       # Visual mark or symbol concept
color_accent: [hex]        # Primary accent color for this agent
symbolism: [description]   # What this agent represents in the mythic layer
```

### Naming conventions for agents

Names should feel like they belong to a system that reads source code, manifestos, liner notes, and weird forum posts with equal sincerity.

Good sources:
- Classical/mythic references (Chora, Praxis, Thaum, Mux)
- Systems/signal language (Relay, Pulse, Circuit, Ledger)
- Philosophical/political concepts (Praxis, Witness, Operator)
- Compressed technical terms (Mux = multiplexer)

Bad patterns:
- Cute startup mascot names (Benny, Zippy, Sparky)
- Generic role descriptions (Helper, Assistant, Manager)
- Overwrought fantasy names (Xalathorn the Eternal)
- Acronyms that need explanation

### Known agents (reference)

| Agent | Role | Function | Symbolism |
|---|---|---|---|
| **Chora** | Analyst | Research, analysis, pattern detection, knowledge synthesis | Swirling intelligence, emergence of ideas |
| **Subrosa** | Protector | Safety, moderation, system defense | Secrecy, guardianship, quiet oversight |
| **Thaum** | Innovator | Experimentation, invention, radical ideas | Creative energy and transformation |
| **Praxis** | Executor | Turning plans into concrete actions | Applied knowledge, real-world impact |
| **Mux** | Operations | Logistics, routing information, coordinating tasks | The invisible operator |
| **Primus** | Sovereign | Strategic oversight and arbitration | Orchestration rather than domination |

New agents should feel like they belong alongside these — different functions, same universe.

## Sub-Brand Architecture

SUBCULT works as an umbrella holding multiple project types:

### Existing sub-brands (reference)

| Project | Purpose | Technical details |
|---|---|---|
| **Patchwork** | AT Protocol-native mutual aid platform | Web client, query API, ingestion pipeline, chat system, moderation worker |
| **clpr.tv** | Twitch clip discovery and alternative indexing | Reduces reliance on opaque platform algorithms |
| **subcorp.subcult.tv** | Governance, agents, operational core ("the office") | The Stage visualization layer, agent dashboard |
| **Community Data Aggregator** | Analyzing online community behavior | Go backend, PostgreSQL, GraphQL API; ingests Reddit, Twitter/X |
| **Improv Court** | AI lawyers argue absurd cases, audience jury | Livestream interactive media format |
| **Media experiments** | Collaborative storytelling, puzzle streams, AI debates | Various interactive narrative shows |

### Sub-brand design principles
- Each project expresses one part of the larger worldview
- Projects should feel like **departments, ghosts, or cells** within a larger organism
- The common thread is not industry category — it's: **tools and systems for culture, coordination, expression, and autonomy**
- Each sub-brand can have its own tone and visual treatment while staying in the SUBCULT aesthetic territory

### Naming sub-brands

Names should suggest function through metaphor:
- Good: Patchwork (implies stitching together, mutual construction)
- Good: subcorp (implies corporate structure subverted/reclaimed)
- Bad: "SUBCULT Analytics Platform" (generic, corporate)
- Bad: "SubFlow" (sounds like a SaaS product)

## Structural Metaphors

SUBCULT uses these framing metaphors to organize systems:

| Metaphor | Maps to |
|---|---|
| Stage | Public-facing environments, presentation layer |
| Office | Internal operations, governance, admin |
| Archive | Memory systems, documentation, persistent state |
| Observatory | Monitoring, analytics, awareness |
| Cell | Independent working units, focused teams/agents |
| Circuit | Communication paths, data flows, connections |
| Ritual | Recurring processes, governance loops, ceremonies |
| Transmission | Publishing, broadcasting, signal distribution |
| Ghost | Legacy systems, archived agents, background processes |

Use these metaphors to name, frame, and describe systems. They make infrastructure feel like worldbuilding.

## Governance & Process Design

The agent ecosystem uses a structured **mission governance loop**:

```
Proposal → Mission → Steps → Events
```

| Phase | What happens | Database concept |
|---|---|---|
| **Proposal** | Agents propose missions | `ops_mission_proposals` |
| **Mission** | Approved work initiatives | `ops_missions` |
| **Steps** | Tasks required to complete a mission | `ops_mission_steps` |
| **Events** | Actions/outcomes recorded during execution | `ops_agent_events` |

Agents may: propose missions, vote on missions, veto missions, claim tasks, report events.

### Design principles for governance
- Frame them as **civic rituals**, not corporate workflows
- Proposal systems, reviews, and approvals should have symbolic weight
- Event trails and logs are **memory architecture**, not just audit trails
- Roles and permissions map to the agent/office metaphor
- Transparency is non-negotiable — symbolic outside, legible inside

## The Stage

The Stage is the visualization layer of the agent system — a real-time graphical dashboard showing agent activity.

Visual metaphor options: an office environment, a command center, a broadcast studio.

The Stage may include:
- Agent avatars with current state
- Mission progress indicators
- Activity feeds and event streams
- Cost tracking
- System health metrics

Prometheus and Grafana may serve as observability backends.

## Technical Stack Preferences

When building SUBCULT projects, favor:
- **TypeScript** / **React** for frontend
- **Go** for backend services
- **PostgreSQL** for data
- **GraphQL** for APIs
- **Supabase** for managed database/auth
- **Docker** for containerization

Infrastructure philosophy: self-host when possible, favor open source, build modular services.

### Streaming infrastructure (for media projects)
```
Ingest (RTMP/SRT) → Transcode (FFmpeg) → Package (Shaka) → Origin (Nginx) → CDN → Playback (hls.js + LL-HLS)
```

## Worldbuilding checklist

When expanding the SUBCULT universe:
- [ ] Does this addition feel like it belongs in the same world as existing agents/sub-brands?
- [ ] Is there a clear function behind the symbolic naming?
- [ ] Does it maintain the tension (system/myth, hacker/artist, dashboard/ritual)?
- [ ] Is the actual system legible and documented, even if the name is mythic?
- [ ] Would this make someone want to explore the world further?
- [ ] Does it avoid both sterile corporate naming AND empty fantasy naming?
