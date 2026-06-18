# Blacktower Integration Boundaries

Use this reference when a change crosses subsystem boundaries.

## Composition root

`src/index.ts` wires runtime behavior. Any change here can affect startup,
tool registration, event handling, managed skills, task sessions, multiplexer
mirroring, and control-center hooks.

Checklist:

- Are new awaited calls timeout-guarded?
- Are event steps wrapped in failure isolation where needed?
- Are tools registered with stable names and docs?
- Are managed resources optional or guaranteed packaged?

## Config

`src/config/schema.ts` and `src/config/loader.ts` must move together.

Checklist:

- Schema accepts existing user config.
- Loader deep-merge behavior preserves user values.
- Generated `blacktower.schema.json` is updated.
- README/docs mention new user-facing fields.

## Agents and skills

Agent skill names must match bundled or expected external skill names exactly.

Checklist:

- Built-in definitions stay schema-valid.
- Board-member additions have provider-tier entries.
- Skill indexes are regenerated.
- Missing bundled skills are intentional, not typos.

## Tools and MCPs

Tools need runtime registration, tests, and user-facing scope clarity.

Checklist:

- Tool args are validated.
- Long operations have timeouts.
- Errors explain recovery.
- Tool docs distinguish similarly named concepts.
