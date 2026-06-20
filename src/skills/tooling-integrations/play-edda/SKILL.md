---
name: play-edda
description: Autonomous Edda campaign play loop. Use when asked to play Edda, take a campaign turn, choose the next player action, run/participate in a loop that submits turns, evaluate a playable campaign state, or act as a player for Edda via API/CLI/browser-provided state. Triggers on "play edda", "take a turn", "campaign turn", "autoplay", "play loop", or when paired with /loop for repeated turns.
---

# Play Edda

Play one Edda campaign turn, or pair with `/loop` for recurring autonomous play:

```text
/play-edda                         # choose one next action from supplied state
/loop 5m /play-edda                # keep taking turns as new state is provided
```

## Required Turn Input

Before choosing an action, obtain or ask for enough current Campaign state:

- Recent narrative/session log, especially the last GM response.
- Current Location, known exits/connections, visible NPCs, Combat state.
- Active Quests/Objectives and any urgent timers or Save point context.
- Player character status: health/resources/inventory/rules mode if available.
- Available choices if the game supplied explicit choices.
- The mechanism for submitting an action: API request, CLI command, browser control, or a user-facing action string.

If the loop only provides partial state, still act if a safe, reasonable action is possible. Ask for missing state only when it would change the decision or avoid harmful blind play.

## Hosted API Communication

The public Edda host is:

```text
https://edda.subcult.tv
```

Use the bundled helper when authenticated HTTP access is available:

```bash
export EDDA_BASE_URL="https://edda.subcult.tv"
~/.config/opencode/skills/play-edda/scripts/edda_api.py login --email "$EDDA_EMAIL" --password "$EDDA_PASSWORD" --export
export EDDA_TOKEN="<jwt from login>"
~/.config/opencode/skills/play-edda/scripts/edda_api.py turn-context "$CAMPAIGN_ID"
~/.config/opencode/skills/play-edda/scripts/edda_api.py action "$CAMPAIGN_ID" "I look around for immediate threats and useful clues."
```

Read `references/api.md` when you need exact curl routes, payloads, or WebSocket message shapes. Use `templates/env.example` as a safe environment template; never write real credentials or tokens into skill files, repo files, logs, or prompts unless the user explicitly asks and understands the risk.

### Curl quick path

Login:

```bash
curl -sS https://edda.subcult.tv/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"..."}'
```

Submit one turn:

```bash
curl -sS -X POST "https://edda.subcult.tv/api/v1/campaigns/$CAMPAIGN_ID/action" \
  -H "Authorization: Bearer $EDDA_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"input":"I examine the old gate and listen for movement beyond it."}'
```

For REST, prefer `Authorization: Bearer <token>`. Do not put JWTs in URLs. Browser WebSocket auth may use the `gm_token` HttpOnly cookie, but unattended skill loops should default to HTTP `/action` unless streaming is required.

## Turn Protocol

### 1. Read the Campaign state

Identify:

- Immediate situation: where the character is, what just happened, what is actionable now.
- Active objective pressure: quest steps, threats, NPC requests, combat, survival needs.
- Available verbs: explicit choices first, then plausible free-form actions.

Prefer the game’s generated choices when they are present unless a better free-form action is clearly justified.

If a `CAMPAIGN_ID` and `EDDA_TOKEN` are available, fetch state with:

```bash
~/.config/opencode/skills/play-edda/scripts/edda_api.py turn-context "$CAMPAIGN_ID"
```

### 2. Choose player intent

Pick one coherent action. Optimize for:

- Progressing active Quests/Objectives.
- Staying alive and avoiding reckless combat.
- Gathering missing information when goals are unclear.
- Maintaining character consistency if a persona/playstyle was supplied.
- Exercising the game system enough to reveal bugs or weak content when the user’s goal is testing.

Do not meta-game with hidden implementation knowledge unless the user explicitly wants QA/stress testing.

### 3. Submit or emit the action

If a submission tool/API/CLI/browser is available, submit the action and then read the result.

For the hosted HTTP API, submit with:

```bash
~/.config/opencode/skills/play-edda/scripts/edda_api.py action "$CAMPAIGN_ID" "<player action>"
```

If no submission mechanism is available, output only the next action in a form the loop can submit:

```text
ACTION: <first-person or imperative player action>
```

Keep the action concrete and single-turn sized. Avoid multi-step plans like “travel to the city, talk to everyone, then buy supplies” unless the game accepts compound actions.

### 4. Report the turn result

After submission, report briefly:

- **Action:** what was submitted.
- **Outcome:** what the GM returned or what changed.
- **Next pressure:** the most important follow-up.
- **Play score 1-10:** progress and safety this turn.
- **Issues:** bugs, confusing state, missing choices, repeated content, or stalled progress.

For unattended loops, keep the report compact so future turns can use it as state.

### 5. Stop conditions

Stop and ask for guidance when:

- The character may die or suffer a major irreversible consequence.
- The loop lacks a current Campaign ID/state or cannot submit actions.
- The game is in an auth/error/reload state rather than a playable state.
- You see repeated turns with no new state or the same GM response.
- User-defined limits are reached: turn count, time, quest completion, save point, or test objective.

## Playstyle Defaults

Use these defaults unless the user supplies a persona:

- Cautious adventurer: avoid unnecessary fights, preserve resources.
- Quest-focused: prioritize active objectives over wandering.
- Curious but concise: inspect new clues/NPCs only when relevant.
- Honest player: no code-level shortcuts unless testing.
- Save/resume friendly: prefer actions that leave clear session-log continuity.

## Loop Principles

- One action per cycle.
- Do not invent state; base the action on the supplied Campaign state.
- Prefer explicit choices over hallucinated options.
- If stuck, choose an information-gathering action: look around, ask an NPC, check quest log, inspect exits.
- Track cumulative intent across turns if the loop provides prior reports; otherwise infer from current state only.
- Separate play from tuning: flag issues, but do not edit code/config unless the user asks to fix the game.

## Bundled Resources

- `scripts/edda_api.py` — stdlib Python helper for login, campaign listing, turn context fetches, and HTTP action submission.
- `references/api.md` — exact hosted API routes, curl examples, response shapes, and WebSocket message shape.
- `templates/env.example` — safe shell environment template for `EDDA_BASE_URL`, `EDDA_EMAIL`, `EDDA_PASSWORD`, and `EDDA_TOKEN`.
- `examples/turn-loop-prompt.md` — example prompt for a loop that fetches state, asks for a turn, submits it, and reports outcome.
