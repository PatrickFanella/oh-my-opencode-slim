---
name: k8s-security-policies
description: Implement Kubernetes security policies including NetworkPolicy, PodSecurityPolicy, and RBAC for production-grade security. Use when securing Kubernetes clusters, implementing network isolation, or enforcing pod security standards.
---

# Kubernetes Security Policies

Implement defense-in-depth for Kubernetes: Pod Security Standards, NetworkPolicy segmentation, least-privilege RBAC, and policy enforcement.

## When to Use This Skill

- Hardening a new cluster or namespace
- Migrating workloads to restricted runtime posture
- Fixing excessive service account or namespace privileges
- Implementing multi-tenant isolation and compliance controls

## Activation Inputs (ask first)

- Kubernetes version + CNI plugin (must support NetworkPolicy)
- Namespace topology (system, shared, tenant, prod)
- Service communication matrix (who talks to who, ports)
- Current RBAC model (roles, bindings, service accounts)
- Enforcement target (`audit` first vs immediate `enforce`)

## Quick Workflow

1. **Baseline namespaces**
   - Label each namespace with Pod Security Standards (`privileged`, `baseline`, or `restricted`).
   - Prefer `audit`/`warn` before strict `enforce` on legacy namespaces.

2. **Default-deny networking**
   - Apply ingress+egress default deny per protected namespace.
   - Add explicit allow rules for app paths + DNS egress.

3. **Least-privilege RBAC**
   - Use `Role`/`RoleBinding` by default.
   - Use `ClusterRole` only for true cluster-scope needs.
   - Bind service accounts, not human users, for workloads.

4. **Pod runtime hardening**
   - `runAsNonRoot`, drop capabilities, read-only root FS, seccomp runtime default.

5. **Admission policy**
   - Enforce org rules with Gatekeeper/Kyverno (labels, image policies, security context).

6. **Verify + iterate**
   - Validate with `kubectl auth can-i` and connectivity tests.
   - Move `audit/warn` -> `enforce` after zero critical breaks.

## Guardrails

- Default deny first. Explicit allow next.
- No wildcard admin/service-account bindings in production.
- Avoid permanent `privileged` namespaces except platform-critical workloads.
- Roll out strict controls in phases for legacy apps.

## Done Criteria

- Namespace security labels applied and reviewed
- Default-deny policy active in protected namespaces
- Required app flows explicitly allowed
- RBAC permissions verified with `can-i` tests
- Audit logs show no unexpected denials

## Resources

- `references/full-guide.md` — detailed patterns, YAML examples, troubleshooting.
- `assets/network-policy-template.yaml` — starter policy template.
- `references/rbac-patterns.md` — RBAC reference patterns.
