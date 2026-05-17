---
name: game-design-theory
description: |
  Comprehensive game design theory covering MDA framework, player psychology,
  balance principles, and progression systems. Master why games are fun.
sasmp_version: "1.3.0"
bonded_agent: 01-game-designer
bond_type: PRIMARY_BOND

parameters:
  - name: framework
    type: string
    required: false
    validation:
      enum: [mda, bartle, flow, reward_systems]
  - name: game_type
    type: string
    required: false
    validation:
      enum: [action, rpg, puzzle, strategy, casual, simulation]

retry_policy:
  enabled: true
  max_attempts: 3
  backoff: exponential

observability:
  log_events: [start, complete, error]
  metrics: [design_quality_score, iteration_count]
metadata:
  version: "2.0.0"
---

# Game Design Theory

Use for system design, balance tuning, and player motivation diagnostics.

## Activation Map

Use this skill when task asks for any of:

- mechanics/dynamics/aesthetics alignment
- core loop design or loop quality diagnosis
- difficulty/flow curve tuning
- reward schedule design
- progression, economy, or PvP fairness balancing

## Core Model

1. Define target **aesthetic** outcomes (emotion/experience).
2. Model **dynamics** that should create those outcomes.
3. Implement **mechanics** that generate those dynamics.
4. Validate via playtests and telemetry.

Shortcut: `Mechanics -> Dynamics -> Aesthetics`.

## Diagnostic Heuristics

- **Boredom** -> challenge too low / weak goals / slow feedback.
- **Frustration/churn** -> spikes, unclear feedback, unfair outcomes.
- **Dominant strategy** -> missing counter-play or option asymmetry.

Fix in order:

1. challenge curve,
2. feedback clarity,
3. reward timing,
4. option balance/counters.

## Player Motivation Lens

Check support for:

- autonomy (choice/control)
- competence (mastery)
- relatedness (social connection)

Cover Bartle preferences where relevant: achiever/explorer/socializer/killer.

## Delivery Contract

When applying skill, return:

- target player experience
- proposed loop/mechanics changes
- expected dynamic effects
- balance risks + mitigations
- test plan and success signals

## Resources

- `references/full-guide.md` — full theory, troubleshooting patterns, detailed checklist.
- `references/DESIGN_GUIDE.md` — focused reference deep-dive.
- `scripts/design_analyzer.py` — deterministic analysis helper.
- `assets/design_config.yaml` — static config for analysis script.

Load deeper resources only when needed; keep this file activation-first.
