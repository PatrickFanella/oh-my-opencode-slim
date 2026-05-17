---
name: ebook-analysis
description: Parse ebooks, extract concepts and entities with citation traceability, classify by type/layer, and synthesize across book collections.
license: MIT
metadata:
  author: jwynia
  version: "2.1"
  domain: research
  cluster: media-meta-analysis
  type: orchestrator
  mode: diagnostic+generative
  maturity: working
  maturity_score: 14
---

# Ebook Analysis

Extract non-fiction knowledge with strict citation traceability.

## Non-Negotiable Rule

Every extracted claim must keep exact quote + source location.

## Choose Mode

| Goal | Mode |
|---|---|
| Understand argument structure, make actionable takeaways | Concept Extraction |
| Build reusable cross-book knowledge base of named items | Entity Extraction |
| Need both | Run Concept, then Entity (or reverse), then synthesize |

## Mode A — Concept Extraction

Extract ideas, then classify:

- type: `principle`, `mechanism`, `pattern`, `strategy`, `tactic`
- layer: `0..4` (foundational -> specific)

Workflow:

1. Parse/chunk source text.
2. Extract top concepts with exact quotes.
3. Classify type/layer.
4. Annotate themes/relationships.
5. Link concepts and export outputs.

Outputs:

- `ebook-analysis/{author}-{title}/analysis.json`
- `ebook-analysis/{author}-{title}/concepts.json`
- `ebook-analysis/{author}-{title}/citations.json`
- `ebook-analysis/{author}-{title}/report.md`

## Mode B — Entity Extraction

Extract named things:

- `study`, `researcher`, `framework`, `anecdote`, `concept`

Workflow:

1. Identify candidate entities by chapter.
2. Check duplicates first.
3. Create or update entity files.
4. Add memorable quotes to `_[book]-quotes.md`.
5. Add related-entity links.
6. Rebuild entity index.

Outputs:

- `knowledge/{domain}/{type}/{entity-slug}.md`
- `knowledge/{domain}/_[book]-quotes.md`
- `knowledge/{domain}/_index.md`
- `knowledge/_entities.json`

## Cross-Book Synthesis Trigger

After 2+ books extracted:

1. detect overlap entities
2. map agreements/contradictions
3. update entity summaries with multi-source synthesis
4. store thematic notes in `context/insights/cross-book-<theme>.md`

## Tooling

- Parse/extract/classify/link/validate: `scripts/ea-*.ts`
- Entity resolution/indexing: `scripts/kb-*.ts`
- Library + bulk helpers: `scripts/calibre-db.ts`, `scripts/bulk-preprocess.ts`, `scripts/bc-*.ts`

## Guardrails

- No extraction without provenance.
- No entity creation without duplicate check.
- No orphan entities (must link related entities).
- No quote-free entities.
- Verify metadata; do not trust book tags blindly.

## Verification Boundaries

Machine-verifiable:

- citation positions
- schema completeness
- reference integrity
- duplicate risk

Human-judgment required:

- significance
- taxonomy edge-cases
- relationship validity
- quote quality

## Resources

- `references/full-guide.md` — full workflows, states, taxonomy, anti-patterns, calibration.
- `references/abstraction-layers.md`
- `references/concept-types.md`
- `references/relationship-types.md`
- `references/functional-axes.md`
- `scripts/` — all `ea-*`, `kb-*`, `bc-*`, and library helpers.
- `templates/analysis-report.md`, `templates/concept-record.json`
- `data/theme-vocabulary.json`, `data/tag-mapping-rules.json`
