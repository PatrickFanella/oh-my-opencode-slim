# Prevention Patterns

## Good prevention actions

- Add a regression test for the exact event ordering that failed.
- Add timeout/logging at the boundary where diagnosis was blind.
- Rename an ambiguous user-facing action.
- Add a prompt/skill guardrail for a repeated orchestration mistake.
- Add release validation for a packaged asset that was forgotten.

## Weak prevention actions

- “Be careful.”
- “Monitor it” without defining a signal.
- “Refactor later” without a tracked owner or trigger.
- “The model should know” when the instruction is not in a prompt/skill/doc.

## Postmortem output shape

Keep it short and actionable:

1. What happened.
2. Why it happened.
3. Why it was not caught sooner.
4. What changed.
5. What still needs follow-up.
