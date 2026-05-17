# Embedding Strategies

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `embedding-strategies-skill.md`

_Source topic: embedding-strategies_

**Purpose:** Select and optimize embedding models for semantic search and RAG applications. Use when choosing embedding models, implementing chunking strategies, or optimizing embedding quality for specific domains.

# Embedding Strategies

Guide to selecting and optimizing embedding models for vector search applications.

## When to Use This Skill

- Choosing embedding models for RAG
- Optimizing chunking strategies
- Fine-tuning embeddings for domains
- Comparing embedding model performance
- Reducing embedding dimensions
- Handling multilingual content

## Core Concepts

### 1. Embedding Model Comparison (2026)

| Model                      | Dimensions | Max Tokens | Best For                            |
| -------------------------- | ---------- | ---------- | ----------------------------------- |
| **voyage-3-large**         | 1024       | 32000      | Claude apps (Anthropic recommended) |
| **voyage-3**               | 1024       | 32000      | Claude apps, cost-effective         |
| **voyage-code-3**          | 1024       | 32000      | Code search                         |
| **voyage-finance-2**       | 1024       | 32000      | Financial documents                 |
| **voyage-law-2**           | 1024       | 32000      | Legal documents                     |
| **text-embedding-3-large** | 3072       | 8191       | OpenAI apps, high accuracy          |
| **text-embedding-3-small** | 1536       | 8191       | OpenAI apps, cost-effective         |
| **bge-large-en-v1.5**      | 1024       | 512        | Open source, local deployment       |
| **all-MiniLM-L6-v2**       | 384        | 256        | Fast, lightweight                   |
| **multilingual-e5-large**  | 1024       | 512        | Multi-language                      |

### 2. Embedding Pipeline

```
Document → Chunking → Preprocessing → Embedding Model → Vector
                ↓
        [Overlap, Size]  [Clean, Normalize]  [API/Local]
```

## Templates
...

# Specialized models for domains
code_embeddings = VoyageAIEmbeddings(model="voyage-code-3")
finance_embeddings = VoyageAIEmbeddings(model="voyage-finance-2")
legal_embeddings = VoyageAIEmbeddings(model="voyage-law-2")
```

### Template 2: OpenAI Embeddings

```python

    # Handle batching for large lists

            # Matryoshka dimensionality reduction

# Dimension reduction with Matryoshka embeddings
def get_reduced_embedding(text: str, dimensions: int = 512) -> List[float]:
    """Get embedding with reduced dimensions (Matryoshka)."""
    return get_embedding(
        text,
        model="text-embedding-3-small",
        dimensions=dimensions
    )
```

### Template 3: Local Embeddings with Sentence Transformers

```python

        # BGE and similar models benefit from query prefix

# E5 model with instructions
class E5Embedder:
    def __init__(self, model_name: str = "intfloat/multilingual-e5-large"):
        self.model = SentenceTransformer(model_name)

    def embed_query(self, query: str) -> np.ndarray:
        """E5 requires 'query:' prefix for queries."""
        return self.model.encode(f"query: {query}")

```

### Template 4: Chunking Strategies

```python

            # Character-level split

                # Recursively split if still too large

### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: embedding-strategies

Source path: `skills/data-database/embedding-strategies`

Canonical skill: `skills/data-database/hybrid-search-implementation`

# Merged skill: embedding-strategies
Source path: `skills/data-database/embedding-strategies`
Canonical skill: `skills/data-database/hybrid-search-implementation`
