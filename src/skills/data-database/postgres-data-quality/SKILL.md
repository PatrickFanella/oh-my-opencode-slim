---
name: postgres-data-quality
description: Implement PostgreSQL-first data quality checks using constraints, indexes, validation queries, pgTAP/dbt when useful, and CI-safe SQL checks. Use when validating Postgres schemas, tables, migrations, ETL outputs, or data contracts. Prefer native Postgres over Great Expectations unless explicitly requested.
---

# Postgres Data Quality

PostgreSQL-first data quality for app databases, analytics tables, migrations, and ETL outputs.

## Use When

- Validating Postgres schema/data correctness.
- Adding constraints, indexes, checks, FKs, uniqueness, and not-null guarantees.
- Writing SQL validation queries for CI or release gates.
- Testing migrations and backfills.
- Creating dbt tests against Postgres-backed models.

## Preferred Stack

1. Native Postgres constraints and indexes.
2. SQL validation queries committed near migrations/jobs.
3. pgTAP or testcontainers-backed integration tests when behavior needs tests.
4. dbt tests only for analytics/modeling flows.
5. Python only when driving report generation or migration validation tooling.

## Workflow

1. Identify invariants: keys, nullability, allowed values, ranges, freshness, referential integrity.
2. Enforce stable invariants in schema first.
3. Add validation queries for conditional/business invariants.
4. Add CI checks around migrations/backfills.
5. Add observability for recurring pipeline checks.
6. Document owners and failure response.

## Output Checklist

- [ ] Invariants listed by table/column.
- [ ] Native constraints used where safe.
- [ ] Validation SQL included for non-schema rules.
- [ ] Backfill/migration checks are reversible and transaction-aware.
- [ ] CI/release command documented.
- [ ] Failure owner and remediation path documented.

## Resources

- `references/full-guide.md` — Postgres data quality patterns.

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/data-quality-frameworks.md` — Data Quality Frameworks guidance.
