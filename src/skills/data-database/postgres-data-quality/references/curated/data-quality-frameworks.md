# Data Quality Frameworks

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `data-quality-frameworks-skill.md`

_Source topic: data-quality-frameworks_

**Purpose:** Implement data quality validation with Great Expectations, dbt tests, and data contracts. Use when building data quality pipelines, implementing validation rules, or establishing data contracts.

# Data Quality Frameworks

Production patterns for implementing data quality with Great Expectations, dbt tests, and data contracts to ensure reliable data pipelines.

## When to Use This Skill

- Implementing data quality checks in pipelines
- Setting up Great Expectations validation
- Building comprehensive dbt test suites
- Establishing data contracts between teams
- Monitoring data quality metrics
- Automating data validation in CI/CD

## Core Concepts

### 1. Data Quality Dimensions

| Dimension        | Description              | Example Check                                      |
| ---------------- | ------------------------ | -------------------------------------------------- |
| **Completeness** | No missing values        | `expect_column_values_to_not_be_null`              |
| **Uniqueness**   | No duplicates            | `expect_column_values_to_be_unique`                |
| **Validity**     | Values in expected range | `expect_column_values_to_be_in_set`                |
| **Accuracy**     | Data matches reality     | Cross-reference validation                         |
| **Consistency**  | No contradictions        | `expect_column_pair_values_A_to_be_greater_than_B` |
| **Timeliness**   | Data is recent           | `expect_column_max_to_be_between`                  |

### 2. Testing Pyramid for Data

```
          /\
         /  \     Integration Tests (cross-table)
        /────\
       /      \   Unit Tests (single column)
      /────────\
     /          \ Schema Tests (structure)
    /────────────\
```

## Quick Start
...

# Validate
results = context.run_checkpoint(checkpoint_name="daily_orders")
```

## Patterns

### Pattern 1: Great Expectations Suite

```python

# great_expectations/checkpoints/orders_checkpoint.yml
name: orders_checkpoint
config_version: 1.0
class_name: Checkpoint
run_name_template: "%Y%m%d-%H%M%S-orders-validation"

validations:
  - batch_request:

  - name: store_validation_result

  - name: store_evaluation_parameters

  - name: update_data_docs

  # Slack notification on failure
  - name: send_slack_notification
```

```python

# Run checkpoint
import great_expectations as gx

context = gx.get_context()
result = context.run_checkpoint(checkpoint_name="orders_checkpoint")

if not result.success:
    failed_expectations = [
```

### Pattern 3: dbt Data Tests

```yaml

# models/marts/core/_core__models.yml
version: 2
