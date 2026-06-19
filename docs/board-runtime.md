# Board Runtime

Board Runtime is the central orchestration subsystem for this project.

It owns:

- consultant role metadata;
- routing policy;
- delegation recommendations;
- council escalation policy;
- in-memory decision records for the first phase;
- future hooks for persistence and TUI/status display.

OpenCode remains the host runtime for auth, providers, model discovery, and
core sessions. DCP and quota remain separate systems.

## First Phase

The first phase makes Board runtime real without forcing a full rename or broad
behavior swap:

1. `board` config namespace.
2. typed Board role registry.
3. prompt rendering through `<Board Runtime>`.
4. route/policy functions.
5. runtime facade with in-memory decisions.

## Later Phases

- persistent Board decisions;
- TUI Board status;
- structured slash/runtime commands;
- deeper executor handoff;
- product rename and package identity migration.

## Commands

Board Runtime exposes a read-only `/board` command for inspection.

- `/board status` shows runtime state (`enabled`, mode, council escalation,
  role count, recent decision count).
- `/board roles` lists configured board roles with id, title, agent, and
  priority.
- `/board route <request>` previews routing on a request and records one
  in-memory decision so you can inspect action, reason, and candidates.

This command is intentionally read-only in this phase.

- no config mutation;
- no persistent state writes;
- no live auto-routing changes;
- no TUI integration changes.

Future role editing and mutation commands come after this read-only surface is
stable.

## Orchestrator Routing Policy

The orchestrator treats the Board as a lightweight advisory layer, not as a
mandatory ceremony. Before non-trivial implementation, it should make a quick
board-routing decision:

1. Does the task touch a Board-owned domain?
2. Could it affect public behavior, compatibility, security, support burden,
   production reliability, data integrity, setup UX, user trust, or long-term
   agent orchestration behavior?
3. Is exactly one advisor the clear owner?
4. Would a short review likely prevent a costly mistake?

If the answer is yes, the orchestrator consults that advisor before editing. If
not, it skips Board review and proceeds.

Board routing is risk-based rather than keyword-based:

| Risk / impact | Advisor lane |
| --- | --- |
| API contracts, auth boundaries, service contracts | Backend/API |
| Secrets, token/session handling, permissions, data exposure | Security |
| Config defaults, compatibility, migrations, releases | Maintainer strategy |
| Setup flow, CLI help, install docs, user-facing errors | DX documentation |
| Workflow UX, automation boundaries, user trust | Devtools product |
| Agent/session/delegation lifecycle | Agent systems |
| Deployment, hosting, environment variables, CI/CD | Cloud/devops |
| Uptime, rollback, incidents, runtime safety | SRE |
| Logs, metrics, traces, dashboards, SLO signal quality | Observability |
| Schemas, indexes, search, persistence, data quality | Database/search |
| Missing coverage, flaky suites, regression strategy | Test strategy |

Advisor prompts should be narrow by default:

```text
Review this planned change for hidden risks in your domain. Return only
blockers, important concerns, and one recommendation.
```

Prefer one advisor. Use two-advisor pairings only when a change clearly spans
both domains or the first advisor identifies cross-domain risk. Council
escalation is reserved for high-stakes disagreement or multi-system ambiguity.

Common escalation pairings:

| Scenario | Pairing |
| --- | --- |
| API/auth boundary | Backend/API + Security |
| Config/defaults/docs | Maintainer strategy + DX documentation |
| Deploy/runtime safety | Cloud/devops + SRE |
| Agent UX/orchestration | Agent systems + Devtools product |
| DB/search correctness | Database/search + Test strategy |
| Observability/reliability | Observability + SRE |

For non-trivial work, final summaries should include one terse Board note, for
example `Board: used @security-warden for token-handling risk` or
`Board: skipped because this was an internal-only refactor`.

If a bug, review finding, or user correction shows that a Board advisor likely
would have caught the issue, add or tighten a routing example rather than
treating the miss as a one-off.

## Manual Validation Scenarios

Use these examples when checking Board routing behavior after prompt changes:

- “Change auth token handling” should consider the security lane.
- “Update config defaults” should consider the maintainer strategy lane.
- “Polish README wording” should skip Board review unless setup or onboarding
  behavior is affected.
- “Refactor an internal helper” should skip Board review.
- “Change agent session lifecycle” should consider the agent-systems lane.

Success means the orchestrator considers the Board more often without slowing
routine internal edits, usually selects only one advisor, and gives a brief
used/skipped note when it summarizes non-trivial work.

## Default Board Groups

The installer materializes five default groups:

- **BUILD** — backend, language, and test advisors.
- **OPS** — cloud, data, observability, SRE, and security advisors.
- **GROWTH** — content, copy, conversion, launch, SEO, and social advisors.
- **PRODUCT** — agent-systems, devtools product, DX documentation, and
  maintainer-strategy advisors.
- **MYTH** — documentation artifacts, media, story, SUBCULT creative direction,
  and worldbuilding advisors.
