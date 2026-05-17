# Authentication & Authorization — Full Guide

Detailed reference moved from `SKILL.md`.

## Scope

This guide covers:

- AuthN vs AuthZ separation
- JWT and refresh token lifecycle
- Session-based auth with server-side stores
- OAuth2/OIDC social login patterns
- RBAC, permission checks, and ownership checks
- Password policy, hashing, and rate limiting
- Common pitfalls and secure defaults

## Core Concepts

### Authentication (AuthN)

Answer: **who is this actor?**

- Identity verification (credentials, OAuth)
- Credential/session issuance
- Login/logout and token/session lifecycle

### Authorization (AuthZ)

Answer: **what can this actor do?**

- Role checks (RBAC)
- Permission checks
- Resource ownership checks

## Strategy Selection

### Session-Based

Use when:

- Browser-first apps
- You want server-controlled revocation and session state

Notes:

- Store sessions in Redis (not process memory)
- Cookie flags: `httpOnly`, `secure` (prod), `sameSite`

### JWT Access + Refresh

Use when:

- Stateless API scale-out
- Multiple clients/services consume same API

Notes:

- Access token short TTL (often 15m)
- Refresh token long TTL (often days)
- Hash refresh tokens at rest and support revocation

### OAuth2/OIDC

Use when:

- Social login (Google/GitHub)
- Enterprise SSO and delegated identity

Notes:

- Verify provider callback handling
- Link provider identity to local user safely

## JWT Pattern (Reference)

Key points from original implementation:

- Payload includes stable identifiers (e.g., `userId`, role claims)
- Verify token and branch errors (`expired` vs `invalid`)
- Middleware extracts `Bearer` token and attaches principal to request

Recommended fields:

- `sub` or `userId`
- role/permission claims (minimal)
- `iat`, `exp`

Avoid:

- Large mutable claims that drift from DB state
- Long-lived access tokens

## Refresh Token Flow (Reference)

Original flow semantics preserved:

1. Verify refresh token signature
2. Lookup hashed token in persistent store
3. Ensure token unexpired and bound to expected user
4. Mint new access token
5. Revoke on logout; revoke all on global logout

Security notes:

- Treat refresh token as credential
- Hash before storage
- Support per-device/session revocation

## Session-Based Flow (Reference)

Original pattern uses:

- `express-session`
- Redis-backed store
- Session fields for principal context
- Auth middleware checking `req.session.userId`

Operational notes:

- Rotate session secret safely
- Set explicit session lifetime
- Clear cookie + destroy session on logout

## OAuth2 / Social Login (Reference)

Original pattern preserved:

- Passport strategy configured with provider credentials
- Find-or-create local user on callback
- Issue app-specific tokens post-auth
- Redirect client to callback URL with session/token handoff

Hardening notes:

- Validate callback and redirect targets
- Use state/nonce protections where applicable
- Keep provider scopes minimal

## Authorization Patterns

### RBAC

- Define explicit role hierarchy (`admin > moderator > user`)
- Middleware enforces required roles per route

### Permission-Based Controls

- Map roles to permissions (`read:users`, `write:posts`, etc.)
- Middleware checks permission set for each request

### Resource Ownership

- Load resource by route ID
- Allow admin bypass when policy permits
- Enforce `resource.ownerId === principal.userId`

## Password Security

Preserved guidance:

- Enforce strong password policy (length + complexity)
- Hash passwords with bcrypt/argon2
- Never store plaintext passwords

Suggested baseline:

- bcrypt cost ~12 (tune for infra)
- Centralized password validation schema

## Rate Limiting

Preserved guidance:

- Strict limiter for login endpoints
- General limiter for API routes
- Optional Redis store for distributed environments

Typical examples:

- Login: 5 attempts / 15 minutes
- API: 100 requests / minute (tune per service)

## Common Pitfalls

- JWT stored in unsafe browser storage for sensitive contexts
- Missing token expiry
- Client-side-only authorization checks
- Missing brute-force protection
- Weak password policy
- Insecure password reset token lifecycle
- Trusting client-provided role/permission fields

## Best Practices Summary

1. Hash all passwords (`bcrypt`/`argon2`)
2. Use HTTPS everywhere
3. Keep access tokens short-lived
4. Secure cookies properly
5. Validate every auth input
6. Rate-limit auth endpoints
7. Add CSRF protections for cookie/session patterns
8. Rotate signing/session secrets regularly
9. Log and monitor auth events
10. Add MFA for higher-risk surfaces
