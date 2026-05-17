# Billing Automation

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `billing-automation-skill.md`

_Source topic: billing-automation_

**Purpose:** Build automated billing systems for recurring payments, invoicing, subscription lifecycle, and dunning management. Use when implementing subscription billing, automating invoicing, or managing recurring payment systems.

# Billing Automation

Master automated billing systems including recurring billing, invoice generation, dunning management, proration, and tax calculation.

## When to Use This Skill

- Implementing SaaS subscription billing
- Automating invoice generation and delivery
- Managing failed payment recovery (dunning)
- Calculating prorated charges for plan changes
- Handling sales tax, VAT, and GST
- Processing usage-based billing
- Managing billing cycles and renewals

## Core Concepts

### 1. Billing Cycles

- Monthly (most common for SaaS)
- Annual (discounted long-term)
- Quarterly
- Weekly
- Custom (usage-based, per-seat)

### 2. Subscription States

```
trial → active → past_due → canceled
              → paused → resumed
```

### 3. Dunning Management

Automated process to recover failed payments through:

- Retry schedules
...

# Process billing cycle
billing.process_billing_cycle(subscription.id)
```

## Subscription Lifecycle Management

```python
from datetime import datetime, timedelta

        # Trigger dunning workflow

            # Will cancel when current period ends

```

## Billing Cycle Processing

```python
        """Process billing for a subscription."""

        # Check if billing is due

        # Generate invoice

        # Attempt payment

            # Payment successful
            # Payment failed

        # Add subscription line item

        # Add usage-based charges if applicable

        # Calculate tax

            # Charge using payment processor
...
