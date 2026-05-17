# Skill Catalog Triage Notes

Working notes for catalog consolidation. `index.md` is generated; keep durable judgment here, then regenerate `index.md` from source.

## Guardrails

- Do not merge skills only because names are similar. Merge only when triggers, workflows, and outputs overlap.
- Prefer one canonical skill per capability; preserve useful old content under `references/curated/<old-skill>.md`.
- Keep hard behavioral boundaries explicit. Example: `story-coach` never writes prose; `story-collaborator` does.
- Tool-backed skills stay active only when they teach routing, preflight, fallback, or workflows not encoded in MCP/plugin docs.
- Before deletion, search for references from commands, agents, hooks, docs, profiles, and generated indexes; update or remove those references in the same change.

## Agent ecosystem

### Combine prompt skills, but avoid a mega meta-skill

- `prompt-craft`
- `prompt-engineering-patterns`

Likely overlap. Keep one canonical prompt-writing skill with branches for agent instructions / skills / slash commands vs runtime prompt templates. Preserve detailed theory as references.

### Combine skill skills, with routing

- `skill-creator`
- `skill-evolution`
- `skills-cli`

Do not flatten into one vague skill. Prefer canonical routing: create/update skill, install/manage skills, improve skill system. Delete superseded skills once the canonical routing is clear.

### Check setup/agent skills

- `setup-matt-pocock-skills` is repo-context/bootstrap-specific. Keep only if actively used by the Matt Pocock workflow family; otherwise make it a reference or local project doc.
- `using-superpowers` may belong in global instructions/hook enforcement, but a hook alone may not replace skill-routing docs. Decide target layer before removal.

## Analytics observability

Keep `grafana-dashboards`, `prometheus-configuration`, and `slo-implementation` separate unless creating an observability suite. They map to distinct outputs.

## Backend architecture

### Combine architecture systems carefully

- `architecture-patterns`
- `microservices-patterns`

Overlap around service boundaries and architecture patterns. Possible canonical `architecture-patterns` with microservices as a branch/reference. Keep if `microservices-patterns` has enough deployment/runtime specifics.

### Keep implementation-specific backend skills

`api-design-principles`, `auth-implementation-patterns`, `cli-developer`, `cqrs-implementation`, `develop-userscripts`, `nodejs-backend-patterns`, `openapi-spec-generation`, `stripe-integration`, `websocket-engineer`, and `workflow-orchestration-patterns` have distinct triggers. Add cross-links where they compose.

## Cloud infra

Keep provider/platform skills separate when execution differs. Possible suite-level routing doc for deploy/CI/IaC/Kubernetes, but avoid hiding concrete preflight steps.

## Creative media

Keep SUBCULT skills as a coherent suite if the brand remains active. `image`, `video`, `presentation-design`, `musical-dna`, and `ebook-analysis` produce different artifacts. `humanizer` overlaps with writing/style; consider moving or cross-linking.

## Data database

Keep `database-migration`, `postgres-pro`, `hybrid-search-implementation`, `data-quality-frameworks`, and `gdpr-data-handling` separate: correctness/perf/privacy concerns differ. Cross-link RAG/hybrid search with agent/RAG skills.

## Debugging

`diagnose` and `systematic-debugging` duplicate. `systematic-debugging` is canonical; delete `diagnose` once useful feedback-loop guidance is folded in. `distributed-tracing` is observability-specific. `triage` is issue workflow, not debugging implementation.

## Dev workflows

### Requirements/planning cluster

- `brainstorming`
- `requirements-interview`
- `workflow-brainstorm`
- `writing-plans`
- `grill-with-docs`

High overlap. Need one clear requirements/planning router, or strong trigger boundaries.

### Combine codemap/cartography

- `codemap`
- `cartography`

Likely duplicate repo mapping. Pick canonical name, fold in useful content, then delete the other active skill.

### Execution/orchestration cluster

`workflow-execute-plans`, `executing-plans`, `sdd-apply`, `workflow-feature-shipper`, `parallel-feature-development`, `team-*`, and `parallel-agents` overlap around execution. Preserve SDD-specific flows only if OpenSpec artifacts are active.

### Tool vs workflow boundary

`using-superpowers`, hook-like skills, and command/plugin-backed flows may belong in global instructions or plugins rather than active skills.

## Docs documents

Split docs lookup from document artifact work.

- Docs/API lookup skills like `openai-docs` may be superseded by docs tools/librarian, unless provider-specific prompt-upgrade guidance remains valuable.
- Artifact skills like `pdf`, `pptx-generator`, `spreadsheet`, `doc`, and `review-doc-consistency` are not replaceable by docs lookup. Keep or consolidate by file type/workflow.

## Frontend UI

### Combine frontend skills with care

- `frontend-design`
- `web-component-design`
- `penpot-uiux-design`
- `tool-ui-ux-pro-max`

These overlap but operate at different layers: visual implementation, component architecture, Penpot-specific design, searchable design intelligence. Prefer canonical UI router plus references/tools, not a giant undifferentiated skill.

### React/Next/Vercel

- `react-modernization` + `react-state-management` can be cross-linked; merging may be too broad.
- `nextjs-app-router-patterns` likely canonical for Next.js. Move `vercel-react-best-practices` into references unless provider-specific guidance is essential.
- `review-react-best-practices` may stay as a review skill if it produces findings rather than implementation guidance.

### Web design review

- `web-design-guidelines`
- `web-design-reviewer`

Likely combine: guidelines as reference, reviewer as active workflow if it inspects rendered UI and edits code.

## Games interactive

Keep gameplay/design/facilitation skills separate unless low usage suggests references. `develop-web-game` is implementation/testing workflow; `game-facilitator` is runtime fiction; `game-design-theory` is theory/advice.

## Git GitHub

Needs dedicated pass with OpenCode plugins/commands.

- `gh-cli`, `gh-address-comments`, `gh-fix-ci`, `git-commit`, `git-advanced-workflows`, `make-repo-contribution`, `to-issues`, and `to-prd` overlap with built-in GitHub tools and slash commands.
- Do not delete until references from commands/hooks/agent instructions are checked and updated.
- Likely pattern: one GitHub CLI reference skill, one repo-contribution workflow, focused PR/CI/comment workflows only if they add policy.

## Growth marketing

### SEO cluster

- `seo-audit`
- `ai-seo`
- `programmatic-seo`
- `schema-markup`

Pick one canonical audit skill; schema, AI SEO, and pSEO can remain satellites if their outputs differ. `seo-audit` is canonical; delete `review-seo-audit`.

### Content/social cluster

- `content-strategy`
- `social-content`

Maybe combine, but social has platform-specific outputs. Keep if those details remain active.

### Keep separate GTM functions

`copywriting`, `customer-research`, `page-cro`, `ab-test-setup`, `email-sequence`, `paid-ads`, `launch-strategy`, `sales-enablement`, `competitor-*`, and `revops` have distinct workflows. Cross-link rather than merge unless duplicate bodies exist.

## Language Go Rust

- Keep `golang-pro` separate.
- `memory-safety-patterns` + `rust-async-patterns` could become `rust-pro` if Rust content dominates. If memory-safety covers C/C++ too, keep broader or rename.

## Language JS TS

Keep `javascript-pro`, `typescript-pro`, and `javascript-testing-patterns` separate. They map to language/runtime/type/test concerns.

## Language Python

Sixteen Python micro-skills may create routing ambiguity. Consider a `python-pro` canonical router with branches/references for async, config, errors, observability, packaging, testing, typing, performance, resource mgmt, and project structure. Keep `uv-package-manager` separate only if tool workflow remains detailed.

## Mobile apps

### React Native cluster

- `react-native-architecture`
- `react-native-design`
- `vercel-react-native-skills`

Either combine into `react-native-pro`, or make Vercel guidance references under architecture/design. Avoid three active skills with overlapping RN triggers.

### Accessibility cluster

- `screen-reader-testing`
- `wcag-audit-patterns`

Different validation depth. Cross-link; merge only if output format and tools converge.

## Product business

Mostly keep separate. These are business advisory skills with different jobs.

- `startup-finance` should own burn/runway/fundraising/math.
- `team-composition-analysis` should own org/hiring/equity/team-shape.
- `competitive-landscape` and `technology-impact` overlap only at strategy level; not enough to merge.

## Quality review

### Combine review skills around `review-quality`

`review-quality` claims merge readiness + clean code + docs consistency. Make it canonical if that is true, fold in useful content, and delete `review-clean-code` / `review-merge-readiness` / possibly `review-doc-consistency` unless focused workflows still justify them as separate active skills.

### Keep specialist analysis out of generic review

`binary-analysis-patterns` and `protocol-reverse-engineering` are not normal code review. Keep specialist, or move to security/reverse-engineering category.

### Clarify simplify/refactor/architecture ladder

`simplify`, `refactor`, and `improve-codebase-architecture` form a ladder: local clarity -> surgical behavior-preserving edits -> architecture opportunities. Cross-link or route explicitly.

## Security

### Do not over-merge security review/risk outputs

`security-best-practices`, `security-threat-model`, and `security-ownership-map` produce different artifacts: coding guidance, abuse-path model, ownership topology. Merge only with hard routing branches.

### Keep platform/security operations distinct

`k8s-security-policies`, `mtls-configuration`, `secrets-management`, `sast-configuration`, `secure-linux-web-hosting`, and `pci-compliance` are implementation/setup skills. A suite can route them, but generic flattening would lose preflight/checklist value.

### Maybe move Bash security

`bash-defensive-patterns` may fit with shell testing/linting unless its security framing is intentional.

## Testing

### Shell testing cluster

`bats-testing-patterns` + `shellcheck-configuration` could become a shell testing/quality skill, or ShellCheck can move under Bash defensive guidance.

### Browser QA overlap

`scoutqa-test`, `webapp-testing`, `playwright`, `agent-browser`, and `use-my-browser` need one routing table:

- live/user browser session -> `use-my-browser`
- generic browser automation -> `agent-browser`
- local QA/regression -> `webapp-testing` or `scoutqa-test`
- raw CLI details -> Playwright reference

### Keep specialized test domains

`backtesting-frameworks`, `temporal-python-testing`, and `tdd` are distinct enough to keep.

## Tooling integrations

### Browser/control surface skills

Same browser routing concern as Testing. Avoid duplicate unresolved guidance; create one canonical routing table.

### Web search wrappers

`web-search`, `web-search-brave`, and `web-search-tavily` should probably be one `web-search` skill with backend branches and API-key preflights.

### VS Code extension skills

`vscode-ext-commands` + `vscode-ext-localization` can become `vscode-extension-development` with sections.

### Tool-backed skills

`caveman`, `sentry`, `stripe`, and `super-productivity-mcp` should stay active only if they add routing/preflight/fallback beyond tool docs.

## Worldbuilding fiction

### Language worldbuilding

`conlang` + `language-evolution` can combine unless `conlang` is kept as fast phonology/name generation and `language-evolution` as historical language-system design.

### World system skills

`worldbuilding`, `shared-world`, and `world-fates` overlap around persistent fictional worlds. Could become canonical `worldbuilding` with branches: diagnose setting, maintain bible, simulate long-term consequences.

### Anti-cliche overlap

`cliche-transcendence` overlaps with `statistical-distance`. Pick one canonical entropy/anti-cliche method and preserve the other as reference.

### Adaptation pipeline

`dna-extraction` -> `adaptation-synthesis` is a clear two-step pipeline. Keep separate unless creating end-to-end adaptation workflow.

## Writing craft

### Story workflow cluster

`story-sense`, `story-coach`, `story-collaborator`, `story-idea-generator`, `chapter-drafter`, `drafting`, `revision`, and `reverse-outliner` need sharp routing. Do not merge coach/collaborator unless the hard boundary is preserved.

### Style/voice cluster

`prose-style`, `voice-analysis`, `humanizer`, and `speech-adaptation` overlap around style/readability/adaptation. `speech-adaptation` may remain separate due audio/listening output.

### Review passes

`fact-check`, `claim-investigation`, `blind-spot-detective`, and `sensitivity-check` are post-generation review passes with different risk domains. Keep separate if triggers remain explicit; otherwise route under broader content review.

### Specialized craft diagnostics

`dialogue`, `joke-engineering`, `lyric-diagnostic`, and `table-tone` are specialized. Keep if used; make references if low traffic.

### Anti-cliche overlap

`statistical-distance` and `cliche-transcendence` likely duplicate core intent. Choose canonical method.

## Review notes from this pass

- `index.md` must remain generated. Manual notes were moved here.
- The visible `index.md` list and summary counts were inconsistent while used as scratch.
- Consolidation suggestions are hypotheses, not implementation decisions.
- Next safe step: search references/usage before deleting or aliasing any skill.
