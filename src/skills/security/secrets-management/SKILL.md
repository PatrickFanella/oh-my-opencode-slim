---
name: secrets-management
description: Implement secure secrets management for CI/CD pipelines using Vault, AWS Secrets Manager, or native platform solutions. Use when handling sensitive credentials, rotating secrets, or securing CI/CD environments.
---

# Secrets Management

Implement secure secret storage, injection, rotation, and scanning for CI/CD and runtime systems.

## When to Use

- Replacing hardcoded credentials in pipelines/apps
- Designing secret access model per environment
- Automating rotation and revocation
- Enforcing auditability and leak prevention

## Activation Inputs (ask first)

- Target platform(s): Vault, AWS/Azure/GCP secret manager, native CI secrets
- Secret classes: API keys, DB creds, cert/key, tokens
- Environments: dev/stage/prod and blast radius boundaries
- Rotation/SLA requirements and consumer downtime tolerance
- CI/CD tooling: GitHub Actions, GitLab CI, Jenkins, Argo, etc.

## Quick Workflow

1. **Inventory + classify**
   - List all secrets and owners.
   - Classify by sensitivity and rotation cadence.

2. **Select source of truth**
   - Centralize in managed secret store (Vault/cloud secret manager).
   - Keep CI-native secrets only for bootstrap where needed.

3. **Least-privilege access**
   - Scope access per environment/workload identity.
   - Prefer short-lived credentials or dynamic secrets.

4. **Safe delivery**
   - Inject at runtime/CI env; never commit in code/config.
   - Mask logs and avoid debug output of secret values.

5. **Rotation + revocation**
   - Define automated rotation path and fallback.
   - Validate cutover and revoke old versions quickly.

6. **Detection + audit**
   - Add secret scanning in pre-commit + CI.
   - Ensure audit trail for reads/updates/deletes.

## Guardrails

- Never print secret values to logs.
- Never reuse production secrets in non-prod.
- Never store long-lived static creds when dynamic possible.
- Always define owner + rotation deadline for every secret.

## Done Criteria

- All known secrets moved out of repo and pipeline YAML plaintext.
- Access controls verified least-privilege by identity/environment.
- Rotation tested and documented.
- Secret scanning enabled in local + CI paths.
- Audit logs available for secret operations.

## Resources

- `references/full-guide.md` — full examples: Vault/AWS/GitHub/GitLab, rotation workflows, External Secrets Operator, secret scanning.
