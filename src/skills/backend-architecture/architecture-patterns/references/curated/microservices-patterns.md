# Microservices Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `microservices-patterns-skill.md`

_Source topic: microservices-patterns_

**Purpose:** Design microservices architectures with service boundaries, event-driven communication, and resilience patterns. Use when building distributed systems, decomposing monoliths, or implementing microservices.

# Microservices Patterns

Master microservices architecture patterns including service boundaries, inter-service communication, data management, and resilience patterns for building distributed systems.

## When to Use This Skill

- Decomposing monoliths into microservices
- Designing service boundaries and contracts
- Implementing inter-service communication
- Managing distributed data and transactions
- Building resilient distributed systems
- Implementing service discovery and load balancing
- Designing event-driven architectures

## Core Concepts

### 1. Service Decomposition Strategies

- Organize services around business functions
- Each service owns its domain
- Example: OrderService, PaymentService, InventoryService

- Core domain, supporting subdomains
- Bounded contexts map to services
- Clear ownership and responsibility

**Strangler Fig Pattern**

- Gradually extract from monolith
- New functionality as microservices
- Proxy routes to old/new systems

### 2. Communication Patterns

- REST APIs
- gRPC
...

# E-commerce example

# Payment Service (separate service)
class PaymentService:
    """Handles payment processing."""

    async def process_payment(self, payment_request: PaymentRequest) -> PaymentResult:
        # Process payment
        result = await self.payment_gateway.charge(
            amount=payment_request.amount,

# Inventory Service (separate service)
class InventoryService:
    """Handles inventory management."""

    async def reserve_items(self, order_id: str, items: List[OrderItem]) -> ReservationResult:
        # Check availability
        for item in items:
            available = await self.inventory_repo.get_available(item.product_id)

        # Reserve items

```

### Pattern 2: API Gateway

```python

        # Parallel requests

        # Handle partial failures

        # Route to order service
```

## Communication Patterns

### Pattern 1: Synchronous REST Communication

```python

# Usage
payment_client = ServiceClient("http://payment-service:8001")
result = await payment_client.post("/payments", json=payment_data)
```

### Pattern 2: Asynchronous Event-Driven

```python
