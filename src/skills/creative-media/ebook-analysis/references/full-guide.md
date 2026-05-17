# Ebook Analysis — Full Guide

Detailed material moved out of `SKILL.md` for progressive disclosure.

## Core Principle

Every extraction must be traceable to exact source text and location. If provenance is weak, do not extract.

## Two Modes

### 1) Concept Extraction

- Purpose: extract ideas by abstraction (`principle -> tactic`)
- Output: `analysis.json`, `concepts.json`, citations/report artifacts
- Best for: argument structure, transferable playbooks, actionable takeaways

### 2) Entity Extraction

- Purpose: extract named things across books
- Output: markdown entities + KB indexes
- Best for: cross-book references and entity resolution

Run both modes when both transferability and cross-book synthesis are needed.

## Entity Mode Details

### Entity types

| Type | Captures | Examples |
|---|---|---|
| study | findings/experiments/data | Flynn Effect |
| researcher | person/org contribution | Anders Ericsson |
| framework | named models/taxonomies | Kind vs Wicked |
| anecdote | stories/events/scenarios | Challenger disaster |
| concept | named ideas not full framework | cognitive entrenchment |

### Edge mapping rules

- simulations/games → usually `anecdote`
- institutions/orgs → `researcher` when they contribute ideas
- historical events → `anecdote`
- thought experiments → `framework` if systematic, else `concept`

Default uncertainty rule: narrative/event → `anecdote`; abstract idea → `concept`; explicit method/system → `framework`.

### Author-as-subject rule

Create an author `researcher` entity if externally notable and relevant to interpretation. Skip if only locally relevant and unverifiable.

### Entity template (canonical fields)

- Title
- `Type`, `Status`, `Last Updated`, `Aliases`
- `Summary`
- `Key Findings / What It Illustrates`
- `Key Quotes`
- `Sources in Collection`
- `Sources NOT in Collection`
- `Related Entities`
- `Open Questions`

### KB layout

```
knowledge/
├── _index.md
├── _entities.json
└── <domain>/
    ├── _index.md
    ├── _<book>-quotes.md
    ├── studies/
    ├── researchers/
    ├── frameworks/
    ├── anecdotes/
    └── concepts/
```

### Entity workflow

1. Scan source book
2. Resolve duplicates (`kb-resolve-entity.ts`)
3. Create/update entities
4. Add quotes file (`_<book>-quotes.md`)
5. Cross-link related entities
6. Rebuild `_entities.json` (`kb-generate-index.ts`)

### Entity state progression

`KB0` no KB → `KB1` structure only → `KB2` extracting → `KB3` unlinked entities → `KB4` linked no index → `KB5` complete.

## Concept Mode Details

### Concept types

`principle`, `mechanism`, `pattern`, `strategy`, `tactic`

### Abstraction layers

Layer 0 foundational → 1 theoretical → 2 strategic → 3 tactical → 4 implementation-specific.

### Relationship types

`INFLUENCES`, `SUPPORTS`, `CONTRADICTS`, `COMPOSED_OF`, `DERIVES_FROM`

### Concept workflow

1. Parse/chunk with positions (`ea-parse.ts`)
2. Extract concepts with exact quotes
3. Classify type/layer
4. Annotate themes + functional axes
5. Link concepts
6. Export analysis outputs

### Concept state progression

`EA0` no input → `EA1` parsed pending → `EA2` extracted → `EA3` classified → `EA4` annotated → `EA5` single-book complete → `EA6` multi-book synthesis → `EA7` reports complete.

## Cross-Book Synthesis

Trigger after 2+ books extracted.

Goals:

1. Detect repeated entities
2. Map conceptual connections
3. Surface contradictions/complements
4. Update entity summaries with multi-source synthesis

Store thematic synthesis notes in `context/insights/cross-book-<theme>.md`.

## Tooling Reference

### Parsing/analysis

- `scripts/ea-parse.ts`
- `scripts/ea-extract.ts`
- `scripts/ea-classify.ts`
- `scripts/ea-link.ts`
- `scripts/ea-validate.ts`

### Knowledge base

- `scripts/kb-resolve-entity.ts`
- `scripts/kb-generate-index.ts`

### Bulk/library support

- `scripts/calibre-db.ts`
- `scripts/bulk-preprocess.ts`
- `scripts/bc-*.ts`

## Anti-Patterns

- extraction flood (too much low-value text)
- missing citation provenance
- duplicate entities without resolve check
- orphan entities without links
- entities without key quotes
- skipping cross-book synthesis after 2+ books

## Verification Boundaries

Can verify:

- citation positions
- schema completeness
- cross-reference integrity
- duplicate detection

Needs human judgment:

- significance
- classification nuance
- relationship truth
- quote quality

## Calibration Notes

- Dense research synthesis books: high entity volume
- Method books: framework-heavy
- Memoir/narrative: anecdote-heavy
- Metadata tags are often wrong; verify subtype before extracting

## Reasoning Escalation

Use extended reasoning for multi-book synthesis, contradiction detection, and gap analysis.
