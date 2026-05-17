# Node.js Backend Patterns — Full Guide

Detailed reference moved from `SKILL.md`.

## Coverage

- Framework setup patterns (Express, Fastify)
- Layered architecture and DI
- Middleware patterns (auth, validation, rate limit, logging)
- Error taxonomy and global handler
- Database/caching patterns
- Production best practices

## Framework Baselines

### Express Baseline

Typical baseline from original:

- `helmet`, CORS, compression
- JSON/urlencoded body parsers with explicit limits
- request logging middleware
- explicit port config and startup logging

Good fit:

- Teams prioritizing ecosystem familiarity and flexibility

### Fastify Baseline

Typical baseline from original:

- `@fastify/helmet`, `@fastify/cors`, `@fastify/compress`
- schema-backed route validation
- built-in performant logger (Pino)

Good fit:

- Throughput-sensitive APIs with strong schema discipline

## Layered Architecture

### Directory Shape

```text
src/
├── controllers/
├── services/
├── repositories/
├── middleware/
├── routes/
├── utils/
├── config/
└── types/
```

### Responsibilities

- **Controller**: map req/res, call service, no business logic
- **Service**: validation + business rules + orchestration
- **Repository**: DB queries only

Benefits:

- Predictable ownership
- Easier testing and mocking
- Lower coupling across transport and persistence

## Dependency Injection

Use container/composition root to wire:

- repositories -> services -> controllers
- infra adapters (db, cache, logger) injected into consumers

Why:

- Test isolation
- safer refactors
- less hidden global state

See deeper examples in `references/advanced-patterns.md`.

## Middleware Patterns

### Authentication / Authorization

Original pattern:

- parse bearer token
- verify JWT
- attach principal to request
- role/permission guard middleware

### Validation

Original pattern:

- schema parser middleware (`zod`)
- transform parser errors to API validation errors
- reject invalid payloads before service logic

### Rate Limiting

Original pattern:

- Redis-backed limiter for distributed deployments
- separate stricter limits for auth endpoints

### Request Logging

Original pattern:

- structured log event on response finish
- include method, URL, status, duration, UA, client IP

## Error Handling Model

### App Error Taxonomy

Preserved classes:

- `AppError` base
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)

### Global Error Handler

Key behavior:

- known operational errors -> mapped status + structured response
- unknown errors -> log stack/context, return generic 500 in production
- async handler wrapper forwards promise rejections

## Database Patterns

Recommended operational defaults:

- SQL pools (`pg` Pool) with max connections and timeouts
- explicit transaction wrapper for multi-step writes
- graceful connection shutdown on SIGTERM/SIGINT

Patterns referenced in `references/advanced-patterns.md`:

- PostgreSQL pool setup
- MongoDB/Mongoose connection lifecycle
- transaction guard pattern

## Auth, Cache, and Response Utilities

### Auth

- short-lived access token + refresh token flow
- bcrypt password verification inside auth service

### Caching

- Redis cache service with `get/set/delete/invalidatePattern`
- optional method-level decorator for read-heavy code paths

### Response Contract

- consistent `success/error/paginated` helpers
- stable shape across endpoints

## Best Practices (Preserved)

1. TypeScript first
2. Strong validation at boundaries
3. Structured logs, not ad-hoc console logs
4. Environment-based config; never hardcoded secrets
5. Rate limiting and CORS policy in production
6. Connection pooling + graceful shutdown
7. Health/readiness endpoints
8. Full test pyramid (unit/integration/E2E)
9. Performance monitoring/APM

## Common Failure Modes

- Business logic leaking into controllers
- Uncaught async route exceptions
- No request validation at edge
- CORS wildcard in production
- DB client leaks on process shutdown
- Non-standardized error envelopes

## Related References

- `references/advanced-patterns.md`
- `references/curated/error-handling-patterns.md`
