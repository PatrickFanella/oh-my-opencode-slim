---
name: python-configuration
description: Python configuration management via environment variables and typed settings. Use when externalizing config, setting up pydantic-settings, managing secrets, or implementing environment-specific behavior.
---

# Python Configuration Management

Purpose: standardize config via environment variables + typed settings objects.

## Use When

- New Python service/app setup
- Migration from hardcoded constants
- Adding secrets/feature flags/env-specific behavior
- Enforcing startup-time config validation

## Don’t Use When

- Task is runtime secret rotation platform design only (Vault/KMS architecture)
- You need framework-specific deployment hardening beyond app config layer

## Workflow

1. **Create one settings module**
   - Single `Settings` model using `pydantic-settings`.
2. **Classify fields**
   - Required (no default), optional default, secret.
3. **Validate at startup (fail fast)**
   - App must crash with clear config error on boot.
4. **Add environment strategy**
   - local/staging/prod enum or equivalent switch.
5. **Define naming convention**
   - Namespaced env vars (`DB_*`, `REDIS_*`, `AUTH_*`).
6. **Support container secrets if needed**
   - `secrets_dir` fallback.
7. **Document required vars**
   - README or deployment docs.

## Output Checklist

- [ ] Central `Settings` class exists and is imported, not scattered `os.getenv()` calls
- [ ] Required values fail startup with actionable error text
- [ ] Secrets are never committed and never hardcoded
- [ ] Dev defaults exist only for non-sensitive values
- [ ] Env var naming is consistent and namespaced
- [ ] Type coercion/validators handle expected formats
- [ ] Env-specific behavior is explicit and testable
- [ ] Nested config groups used where clarity improves maintainability
- [ ] Config documentation updated with required variables

## Guardrails

- Keep config access read-only after load where practical
- Avoid dynamic mutation of global settings during request handling
- Treat config schema change like API change: version and review

## Resources

- Full guide: `references/full-guide.md`
