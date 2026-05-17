---
name: auth-implementation-patterns
description: Master authentication and authorization patterns including JWT, OAuth2, session management, and RBAC to build secure, scalable access control systems. Use when implementing auth systems, securing APIs, or debugging security issues.
---

# Authentication & Authorization Implementation Patterns

## Purpose

Design and implement secure auth systems: AuthN (identity), AuthZ (permissions), token/session lifecycle, and hardened access controls.

## Use This Skill When

- Building login, registration, logout, password reset
- Adding JWT/session auth to REST or GraphQL APIs
- Implementing OAuth2/OIDC social login or SSO
- Designing RBAC/permission/ownership checks
- Hardening auth surfaces (rate limits, cookie policy, token rotation)
- Migrating or debugging production auth flows

## Avoid This Skill When

- You only need generic Node.js API scaffolding (use `nodejs-backend-patterns`)
- You only need infra/network policy hardening (use `k8s-security-policies`)

## Workflow

1. **Pick auth model**
   - Session-based (stateful cookie) for web apps
   - JWT access + refresh tokens for stateless APIs
   - OAuth2/OIDC for delegated identity/SSO

2. **Define trust boundaries**
   - Token transport (`Authorization` header or secure cookie)
   - Secret material (`JWT_SECRET`, refresh secret, session secret)
   - Rotation, expiration, and revocation requirements

3. **Implement AuthN flow**
   - Credential validation + strong password hashing
   - Access token short TTL (typically 15–30m)
   - Refresh token persistence + revocation strategy

4. **Implement AuthZ flow**
   - RBAC role hierarchy for coarse controls
   - Permission-level checks for fine controls
   - Resource-ownership checks for object-level access

5. **Apply defensive controls**
   - Login/API rate limiting
   - Input validation on all auth endpoints
   - Secure cookie flags (`httpOnly`, `secure`, `sameSite`)
   - Security event logging (failed logins, token failures)

6. **Verify and ship safely**
   - Test happy/fail paths for login/refresh/logout/revocation
   - Test unauthorized/forbidden boundaries explicitly
   - Confirm rollback plan for key/secret rotation

## Output Checklist

- [ ] Chosen auth model and rationale documented
- [ ] Access/refresh/session lifecycle implemented with expiry + revocation
- [ ] Auth middleware integrated on protected routes
- [ ] Role/permission/ownership policies enforced server-side
- [ ] Password policy + hashing implemented (never plain text)
- [ ] Rate limiting and validation enabled on auth endpoints
- [ ] Security logging for auth events in place
- [ ] Common pitfalls avoided (`localStorage` JWT for sensitive apps, no expiry, no limits)

## Resources

- `references/full-guide.md` — detailed patterns, code examples, pitfalls, troubleshooting
