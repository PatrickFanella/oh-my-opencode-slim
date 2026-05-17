# Paypal Integration

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `paypal-integration-skill.md`

_Source topic: paypal-integration_

**Purpose:** Integrate PayPal payment processing with support for express checkout, subscriptions, and refund management. Use when implementing PayPal payments, processing online transactions, or building e-commerce checkout flows.

# PayPal Integration

Master PayPal payment integration including Express Checkout, IPN handling, recurring billing, and refund workflows.

## When to Use This Skill

- Integrating PayPal as a payment option
- Implementing express checkout flows
- Setting up recurring billing with PayPal
- Processing refunds and payment disputes
- Handling PayPal webhooks (IPN)
- Supporting international payments
- Implementing PayPal subscriptions

## Core Concepts

### 1. Payment Products

- One-time payments
- Express checkout experience
- Guest and PayPal account payments

- Recurring billing
- Subscription plans
- Automatic renewals

- Send money to multiple recipients
- Marketplace and platform payments

### 2. Integration Methods

- Smart Payment Buttons
- Hosted payment flow
- Minimal backend code

- Full control over payment flow
...

# Backend - Verify and capture order
from paypalrestsdk import Payment
import paypalrestsdk

paypalrestsdk.configure({
    "mode": "sandbox",  # or "live"
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"

        # Payment successful
        # Payment failed
```

## Express Checkout Implementation

### Server-Side Order Creation

```python

```

## IPN (Instant Payment Notification) Handling

### IPN Verification and Processing

```python

    # Get IPN message

    # Verify IPN with PayPal

    # Process IPN based on transaction type

    # Add 'cmd' parameter

    # Send back to PayPal for verification
...

# Usage
try:
    order = handle_paypal_api_call(lambda: client.create_order(25.00))
except PayPalError as e:
    # Handle error appropriately
    log_error(e)
```

## Testing

```python
