# Skill Audit Workflow

Use this workflow to keep the shared skill catalog concise, portable, and useful
across 200+ skills without turning `SKILL.md` files into prompt dumps.

Source principles:

- `QUALITY.md` — local merge rubric.
- `CATALOG.md` — catalog layout and naming policy.
- Agent Skills standard clipping: `/home/onnwee/.kvant/003 Resources/Clippings/The Agent Skills Standard How a Simple SKILL.md File Turns AI Agents Into On-Demand Specialists.md`.

## Core principle

`SKILL.md` routes and instructs. `references/` explains. `scripts/` executes
repeatable deterministic work. `assets/` stores static inputs. `examples/` are
rare and only present when they materially improve execution.

Skills are portable procedural knowledge. They are not tools, hooks, plugins,
MCP servers, prompts, or subagents, though they can teach an agent how to use
those layers.

## Progressive disclosure target

Keep each skill aligned to the three loading tiers:

1. **Discovery:** frontmatter `name` and `description` only.
2. **Activation:** concise `SKILL.md` workflow, rules, output format, and map.
3. **Execution:** optional `references/`, `scripts/`, `assets/`, `templates/`,
   and exceptional `examples/` loaded only when needed.

`SKILL.md` should usually fit in 500-2,000 tokens. Move detailed frameworks,
long examples, edge cases, API references, and archived bodies to
`references/`.

## Per-skill audit loop

1. Read `SKILL.md` frontmatter and body.
2. Inspect optional resource dirs: `references/`, `scripts/`, `assets/`,
   `templates/`, `examples/`.
3. Check nearby skills in the same category for trigger overlap.
4. Decide whether this should remain a skill or move partly/fully to another
   layer.
5. Score the rubric below.
6. Apply the smallest useful change.
7. Regenerate `skills/index.json` and `skills/index.md` if catalog metadata
   changed.
8. Run `bash scripts/validate-hub.sh` before merge.

## Right-abstraction decision gate

Ask: **Is this mostly procedural judgment or mostly deterministic action?**

| Better as | Use when | Catalog action |
| --- | --- | --- |
| Skill | Needs workflow, judgment, heuristics, routing, output format, or domain coaching | Keep as skill |
| Tool/function | Deterministic input -> structured output/action | Move action to script/tool; keep small wrapper skill only if workflow matters |
| MCP | Needs external system, API, database, SaaS, or authenticated resource connectivity | Build/use MCP for connectivity; skill teaches safe use |
| Hook | Must run automatically on lifecycle/tool events | Move enforcement to hook; skill can document policy |
| Plugin | Adds runtime behavior, UI, permissions, commands, or integrated tools | Move runtime behavior to plugin; skill can be companion docs |
| Prompt/command | One-shot instruction or short repeatable invocation, no durable workflow | Convert to slash command/template/prompt |
| Subagent | Needs isolated context, independent model/tools, or long autonomous work | Use subagent; skill can define playbook and handoff format |
| Reference | Useful knowledge but no activation trigger | Demote into another skill's `references/` |

Mixed cases should split: keep the skill as a concise playbook and move the
deterministic or runtime portion to the right layer.

## Quality rubric

Score each axis 0-2.

| Axis | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Routing | Vague, overlapping, or generic | Usable but ambiguous | Precise triggers and negative triggers where needed |
| Concision | Bloated prompt dump | Some removable detail | Tight activation instructions |
| Progressive disclosure | Everything in `SKILL.md` | Some resources split out | Clean discovery/activation/execution split |
| Resource map | Missing or stale | Partial | All resources indexed from `SKILL.md` |
| References | Noisy, stale, duplicated, or unindexed | Usable | Concise, on-topic, heading-indexed |
| Scripts | Missing when clearly useful, unsafe, or undocumented | Partial usage/side-effect docs | Useful, deterministic, thorough, documented |
| Assets/templates | Missing, orphaned, or unclear | Present but weakly explained | Proper static inputs, linked and justified |
| Examples | Excessive or missing when necessary | Acceptable | Minimal, executable, only where necessary |
| Portability | Hardcoded local/vendor assumptions | Minor assumptions | Portable paths and documented compatibility |
| Safety | Risky actions/secrets/no gates | Some warnings | Clear trust boundaries, confirmations, allowed tools where useful |
| Right abstraction | Wrong layer | Mixed but recoverable | Skill/tool/MCP/hook/plugin boundary is correct |

Suggested outcome:

- 19-22: `clean`
- 15-18: `minor-edit`
- 10-14: `focused-repair`
- 0-9: `deep-rewrite`, `split`, `merge`, or `convert-*`

## Resource standards

### `SKILL.md`

- Frontmatter `name` matches folder.
- `description` is 1-1024 chars and says when to use the skill.
- Add negative triggers when overlap is likely.
- Body contains the active workflow, core constraints, output shape, and
  resource map.
- Avoid long examples, full framework catalogs, copied documentation, and
  stale provider-specific minutiae.

### `references/`

- Use for durable explanatory material.
- Keep files concise and heading-indexed.
- Preserve retired skill content under `references/curated/<old-skill>.md`.
- Rename archived `SKILL.md` files inside references so recursive indexing does
  not treat them as active skills.

### `scripts/`

- Use only for repeated deterministic work.
- Each script should document usage, inputs, outputs, side effects, and failure
  modes through `--help`, a docstring, or nearby reference docs.
- Network, filesystem, credential, or destructive scripts need explicit trust
  boundaries and confirmation guidance.

### `assets/`

- Use for static datasets, binaries, fixtures, and reusable source material.
- Link or explain assets from `SKILL.md` or a resource map.
- Remove orphaned assets unless intentionally archived.

### `templates/`

- Prefer templates over examples when a reusable output/input skeleton is the
  real asset.

### `examples/`

- Default to no examples.
- Add only when syntax, output shape, or API use is hard to infer.
- Keep examples short, current, and executable where possible.

## Batch strategy

Use rolling, resumable batches rather than one giant review.

1. **Static triage:** run `scripts/audit_skills.py` to find size outliers,
   broken resource maps, missing descriptions, ambiguous layer candidates, and
   high-risk scripts.
2. **Fast classification:** review 10-20 skills at a time and assign outcomes.
3. **High-impact repairs:** fix broken skills, routing collisions, huge
   `SKILL.md` files, unsafe scripts, and wrong-layer content first.
4. **Category sweeps:** review by directory category to catch overlap and drift.
5. **Validation:** regenerate the skill index and run hub validation.

Recommended command:

```bash
python3 scripts/audit_skills.py --batch-size 15 --resume --report
```

To drain the static-audit queue without stopping between batches:

```bash
python3 scripts/audit_skills.py --batch-size 15 --resume --until-complete --report
```

To cap a long run:

```bash
python3 scripts/audit_skills.py --batch-size 15 --resume --until-complete --max-batches 4 --report
```

The audit state lives in `skills/audits/skill-audit-state.json`. Reports should
go under `skills/audits/` with an ISO timestamp or batch name so later loops do
not overwrite earlier evidence.

## Outcome labels

- `clean` — no change needed.
- `minor-edit` — wording, links, or small resource-map fix.
- `focused-repair` — concise rewrite or resource cleanup.
- `split` — one skill should become multiple skills or one skill plus tool.
- `merge` — duplicate capability should fold into canonical skill.
- `demote-to-reference` — useful content lacks standalone trigger.
- `convert-to-tool` — deterministic action belongs in script/tooling.
- `convert-to-mcp` — external connectivity belongs in MCP.
- `convert-to-hook` — automatic enforcement belongs in hook.
- `convert-to-plugin` — runtime behavior belongs in plugin.
- `convert-to-prompt` — one-shot text belongs in command/template/prompt.
- `blocked` — requires user decision, credentials, missing context, or policy.

## Done definition

A skill audit batch is done when:

- Findings are recorded in `skills/audits/`.
- Any edits are minimal and aligned to the right abstraction.
- `python3 scripts/generate_skill_index.py` has run if needed.
- `bash scripts/validate-hub.sh` passes before merge.
