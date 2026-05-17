# Vector Index Tuning

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `vector-index-tuning-skill.md`

_Source topic: vector-index-tuning_

**Purpose:** Optimize vector index performance for latency, recall, and memory. Use when tuning HNSW parameters, selecting quantization strategies, or scaling vector search infrastructure.

# Vector Index Tuning

Guide to optimizing vector indexes for production performance.

## When to Use This Skill

- Tuning HNSW parameters
- Implementing quantization
- Optimizing memory usage
- Reducing search latency
- Balancing recall vs speed
- Scaling to billions of vectors

## Core Concepts

### 1. Index Type Selection

```
Data Size           Recommended Index
────────────────────────────────────────
< 10K vectors  →    Flat (exact search)
10K - 1M       →    HNSW
1M - 100M      →    HNSW + Quantization
> 100M         →    IVF + PQ or DiskANN
```

### 2. HNSW Parameters

| Parameter          | Default | Effect                                               |
| ------------------ | ------- | ---------------------------------------------------- |
| **M**              | 16      | Connections per node, ↑ = better recall, more memory |
| **efConstruction** | 100     | Build quality, ↑ = better index, slower build        |
| **efSearch**       | 50      | Search quality, ↑ = better recall, slower search     |

### 3. Quantization Types

```
Full Precision (FP32): 4 bytes × dimensions
Half Precision (FP16): 2 bytes × dimensions
INT8 Scalar:           1 byte × dimensions
Product Quantization:  ~32-64 bytes total
Binary:                dimensions/8 bytes
```

## Templates
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: vector-index-tuning

Source path: `skills/data-database/vector-index-tuning`

Canonical skill: `skills/data-database/hybrid-search-implementation`

# Merged skill: vector-index-tuning
Source path: `skills/data-database/vector-index-tuning`
Canonical skill: `skills/data-database/hybrid-search-implementation`
