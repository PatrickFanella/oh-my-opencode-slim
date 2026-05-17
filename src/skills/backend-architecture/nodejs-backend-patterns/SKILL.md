---
name: nodejs-backend-patterns
description: Build production-ready Node.js backend services with Express/Fastify, implementing middleware patterns, error handling, authentication, database integration, and API design best practices. Use when creating Node.js servers, REST APIs, GraphQL backends, or microservices architectures.
---

# Node.js Backend Patterns

## Purpose

Implement production-grade Node.js backends with clear layering, safe middleware, robust error handling, and operational guardrails.

## Use This Skill When

- Building REST/GraphQL services or microservices on Node.js
- Choosing Express vs Fastify foundations
- Designing controller/service/repository separation
- Implementing middleware for auth, validation, rate limiting, logging
- Standardizing API error/response contracts
- Adding DB integration, caching, and graceful shutdown behavior

## Avoid This Skill When

- Work is mostly auth policy and token lifecycle (use `auth-implementation-patterns`)
- Work is infra-only CI/CD or Kubernetes manifest design

## Workflow

1. **Choose runtime stack**
   - Express for ecosystem simplicity
   - Fastify for schema-first performance
   - Prefer TypeScript for API contracts

2. **Establish architecture boundaries**
   - Controllers: HTTP adapter only
   - Services: business rules
   - Repositories: persistence and queries
   - Inject dependencies to keep testing simple

3. **Install middleware baseline**
   - Security (`helmet`, CORS policy)
   - Parsing/compression
   - Validation (`zod`/Joi)
   - Auth/authz middleware
   - Rate limiter (Redis-backed for distributed)
   - Structured request logging (Pino/Winston)

4. **Implement error model**
   - Custom app error classes (`400/401/403/404/409/500`)
   - Single global error handler
   - Async wrapper for route handlers
   - Hide internal details in production responses

5. **Add data and reliability patterns**
   - Connection pooling for SQL
   - Transaction boundaries for multi-step writes
   - Cache strategy (Redis TTL + invalidation)
   - Graceful shutdown for HTTP + DB + queue clients

6. **Verify production readiness**
   - Health/readiness endpoints
   - Unit + integration + E2E tests
   - Observability fields in logs (method, route, status, latency, request id)

## Output Checklist

- [ ] Framework choice and rationale documented
- [ ] Layered architecture with DI boundaries in place
- [ ] Middleware stack covers security, validation, auth, rate limiting, logging
- [ ] Centralized error classes + global handler implemented
- [ ] DB pooling + transaction strategy defined
- [ ] API response contract standardized
- [ ] Health checks + graceful shutdown implemented
- [ ] Test strategy (unit/integration/E2E) defined and wired

## Resources

- `references/full-guide.md` — curated detailed patterns moved from original SKILL
- `references/advanced-patterns.md` — extended implementations (DB/auth/cache/DI)

## Merged Skills

- `error-handling-patterns` content preserved under:

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/error-handling-patterns.md` — Error Handling Patterns guidance.
