---
name: mtls-configuration
description: Configure mutual TLS (mTLS) for zero-trust service-to-service communication. Use when implementing zero-trust networking, certificate management, or securing internal service communication.
---

# mTLS Configuration

Configure and enforce mutual TLS for zero-trust service-to-service traffic.

## When to Use This Skill

- Rolling out mTLS in Istio/Linkerd/service mesh
- Designing cert hierarchy and rotation policy
- Hardening east-west traffic for compliance
- Debugging handshake, trust, or policy failures

## Activation Inputs (ask first)

- Mesh/runtime: Istio, Linkerd, SPIFFE/SPIRE, custom proxy
- Current mode: plaintext, permissive, mixed, strict
- Namespace/workload map + exception ports (metrics, DB, legacy)
- Certificate source: mesh CA, cert-manager, external PKI
- Rotation target (TTL, renew window, outage tolerance)

## Quick Workflow

1. **Policy staging**
   - Start `PERMISSIVE` for migration zones.
   - Set target namespaces/workloads for `STRICT`.

2. **Traffic policy alignment**
   - Align peer auth + destination rules/service policy.
   - Explicitly model external service TLS mode (`SIMPLE` vs `MUTUAL`).

3. **Identity + cert lifecycle**
   - Define trust domain and CA chain.
   - Use short-lived workload certs with automated renew.

4. **Exceptions control**
   - Document non-mTLS ports and legacy carve-outs.
   - Time-box all exceptions.

5. **Validation + observability**
   - Verify mTLS state/handshakes with mesh tooling.
   - Alert on expiry windows and handshake errors.

## Guardrails

- No permanent plaintext service traffic in production.
- No long-lived workload certs without renewal automation.
- Never skip cert chain verification for “quick fixes.”
- Keep rollout reversible: namespace/workload scoped policy steps.

## Done Criteria

- Target namespaces/workloads run in strict mTLS mode
- Cert issuance + rotation verified end-to-end
- Exception list documented with expiry owner/date
- Dashboards/alerts cover cert expiry + TLS errors

## Resources

- `references/full-guide.md` — detailed mesh templates, cert-manager/SPIRE patterns, rotation and debugging commands.
