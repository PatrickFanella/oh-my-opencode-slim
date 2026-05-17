# Sql Optimization Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `sql-optimization-patterns-skill.md`

_Source topic: sql-optimization-patterns_

**Purpose:** Master SQL query optimization, indexing strategies, and EXPLAIN analysis to dramatically improve database performance and eliminate slow queries. Use when debugging slow queries, designing database schemas, or optimizing application performance.

# SQL Optimization Patterns

Transform slow database queries into lightning-fast operations through systematic optimization, proper indexing, and query plan analysis.

## When to Use This Skill

- Debugging slow-running queries
- Designing performant database schemas
- Optimizing application response times
- Reducing database load and costs
- Improving scalability for growing datasets
- Analyzing EXPLAIN query plans
- Implementing efficient indexes
- Resolving N+1 query problems

## Core Concepts

### 1. Query Execution Plans (EXPLAIN)

Understanding EXPLAIN output is fundamental to optimization.

```sql
-- Basic explain
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- With actual execution stats
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'user@example.com';

-- Verbose output with more details
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.*, o.order_total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days';
```

...

# Bad: Executes N+1 queries
users = db.query("SELECT * FROM users LIMIT 10")
for user in users:
    orders = db.query("SELECT * FROM orders WHERE user_id = ?", user.id)
    # Process orders
```

**Solution: Use JOINs or Batch Loading**

```sql

```

```python

# Group orders by user_id
orders_by_user = {}
for order in orders:
    orders_by_user.setdefault(order.user_id, []).append(order)
```

### Pattern 2: Optimize Pagination

**Bad: OFFSET on Large Tables**

```sql
```

**Good: Cursor-Based Pagination**

```sql
-- Much faster: Use cursor (last seen ID)

```

### Pattern 3: Aggregate Efficiently

**Optimize COUNT Queries:**

```sql

-- Good: Use estimates for approximate counts

-- Better: Use index-only scan
```

**Optimize GROUP BY:**

```sql

### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: sql-optimization-patterns
Source path: `skills/data-database/sql-optimization-patterns`
Canonical skill: `skills/data-database/postgres-pro`
