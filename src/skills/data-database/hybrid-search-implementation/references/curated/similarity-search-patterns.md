# Similarity Search Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `similarity-search-patterns-skill.md`

_Source topic: similarity-search-patterns_

**Purpose:** Implement efficient similarity search with vector databases. Use when building semantic search, implementing nearest neighbor queries, or optimizing retrieval performance.

# Similarity Search Patterns

Patterns for implementing efficient similarity search in production systems.

## When to Use This Skill

- Building semantic search systems
- Implementing RAG retrieval
- Creating recommendation engines
- Optimizing search latency
- Scaling to millions of vectors
- Combining semantic and keyword search

## Core Concepts

### 1. Distance Metrics

| Metric             | Formula            | Best For              |
| ------------------ | ------------------ | --------------------- | --- | -------------- |
| **Cosine**         | 1 - (A·B)/(‖A‖‖B‖) | Normalized embeddings |
| **Euclidean (L2)** | √Σ(a-b)²           | Raw embeddings        |
| **Dot Product**    | A·B                | Magnitude matters     |
| **Manhattan (L1)** | Σ                  | a-b                   |     | Sparse vectors |

### 2. Index Types

```
┌─────────────────────────────────────────────────┐
│                 Index Types                      │
├─────────────┬───────────────┬───────────────────┤
│    Flat     │     HNSW      │    IVF+PQ         │
│ (Exact)     │ (Graph-based) │ (Quantized)       │
├─────────────┼───────────────┼───────────────────┤
│ O(n) search │ O(log n)      │ O(√n)             │
│ 100% recall │ ~95-99%       │ ~90-95%           │
│ Small data  │ Medium-Large  │ Very Large        │
└─────────────┴───────────────┴───────────────────┘
```

## Templates
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: similarity-search-patterns

Source path: `skills/data-database/similarity-search-patterns`

Canonical skill: `skills/data-database/hybrid-search-implementation`

# Merged skill: similarity-search-patterns
Source path: `skills/data-database/similarity-search-patterns`
Canonical skill: `skills/data-database/hybrid-search-implementation`
