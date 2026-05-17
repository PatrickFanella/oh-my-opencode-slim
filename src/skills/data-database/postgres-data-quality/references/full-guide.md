# Postgres data quality guide

## Native guarantees

Prefer database-enforced guarantees:

- `NOT NULL`
- `UNIQUE` and partial unique indexes
- `CHECK` constraints
- foreign keys with explicit `ON DELETE`/`ON UPDATE`
- exclusion constraints for overlapping ranges
- generated columns for normalized invariants

## Validation query pattern

Each check should return zero rows on success:

```sql
-- invalid active subscriptions without customer
select id
from subscriptions
where status = 'active'
  and customer_id is null;
```

## Migration gate pattern

1. Run migration in test database.
2. Run invariant queries.
3. Run rollback if supported.
4. Run invariant queries again or verify expected rollback state.

## Freshness

```sql
select max(created_at) as newest_event
from events
having max(created_at) < now() - interval '15 minutes';
```

## Duplicate detection

```sql
select natural_key, count(*)
from table_name
group by natural_key
having count(*) > 1;
```

## Python use

Python is acceptable when it drives a tool: generating reports, comparing schemas, running validation SQL, or producing CI artifacts.
