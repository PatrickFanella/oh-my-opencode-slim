# Deployment Pipeline Design — Full Guide

Detailed reference moved from `SKILL.md`.

## Objectives

- Safe, fast, repeatable delivery
- Automated and auditable promotion gates
- Progressive rollout with measurable risk control
- Fast and reliable rollback

## Inputs to Collect

- App/runtime shape (containerized, monolith/microservice)
- Deployment target (Kubernetes, ECS, VMs, serverless)
- Environment topology (dev/staging/prod, regions)
- Downtime and rollback SLA expectations
- Approval/compliance requirements
- Monitoring stack for automated decisions

## Expected Outputs

- Pipeline stage DAG and execution order
- Rollout strategy and config parameters
- Gate definitions (manual + metric)
- Health verification scripts and thresholds
- Rollback automation and runbook

## Canonical Stage Flow

```text
Source -> Build -> Test -> Staging Deploy -> Integration -> Approval -> Production -> Verify -> Rollback(if needed)
```

Typical stage semantics:

1. **Source**: checkout, dependency graph
2. **Build**: compile/package/containerize/sign
3. **Test**: unit/integration/security scans
4. **Staging deploy**: smoke checks
5. **Integration**: E2E/contracts/perf sanity
6. **Approval gate**: manual and/or automated
7. **Production**: rollout execution
8. **Verification**: deep readiness + synthetic checks
9. **Rollback**: triggered on failed gates/signals

## Approval Gate Patterns

### Manual Approval

- GitHub Environments required reviewers
- Azure manual validation jobs
- Team/role-based sign-off controls

### Time-Window Gate

- Delayed deploy jobs
- Change window enforcement

### Automated Metric Gate

- Argo Rollouts AnalysisTemplate
- Gate script querying Prometheus/Datadog/etc.

Critical knob:

- `inconclusiveLimit` to prevent indefinite canary stalls

## Deployment Strategy Matrix

| Strategy | Downtime | Rollback | Cost | Best Fit |
|---|---|---|---|---|
| Rolling | None | Minutes | Low | Most stateless services |
| Blue-Green | None | Near-instant | Higher (temporary duplicate) | High-risk releases |
| Canary | None | Fast | Moderate | High-traffic metric-driven apps |
| Recreate | Yes | Fast | Low | Non-critical/dev workloads |
| Feature Flag | None | Instant toggle | Low | Feature exposure control |

## Progressive Delivery Notes

### Rolling

- Tune `maxSurge` / `maxUnavailable`
- Good default for stateless workloads

### Blue-Green

- Maintain old and new stacks simultaneously
- Flip traffic selector/load balancer target
- Near-instant rollback path

### Canary

- Gradual traffic percentages (e.g., 10/25/50/100)
- Pause between steps for metric evaluation
- Auto-promote/abort based on analysis

### Feature Flags

- Decouple deploy from release
- Segment rollout by user cohort

## Health Verification

### Shallow vs Deep Checks

- **Shallow** `/ping`: process alive only
- **Deep readiness**: dependencies verified (DB/cache/queue)

Use deep readiness for promotion/rollback gates.

### Post-Deploy Script Behavior

Reference behavior from original:

- Retry readiness N times with sleep interval
- Fail pipeline if not healthy within timeout window

## Rollback Patterns

### Automated

- Deploy -> wait rollout -> deep verify -> rollback on failure

### Manual

- inspect revision history
- rollback to previous or specific revision
- verify rollback completion

### DB Migration Safety

- Keep schema changes backward-compatible for at least one release cycle
- Avoid destructive schema ops until old code paths are fully retired
- Version forward + undo migration scripts together

## Pipeline Best Practices (Preserved)

1. Fail fast (cheap checks first)
2. Parallelize independent jobs
3. Cache dependencies and layers
4. Build once, promote same artifact
5. Maintain staging/prod parity
6. Never hardcode secrets
7. Enforce deploy windows when required
8. Ensure idempotent deploy jobs
9. Auto-rollback on objective failure signals
10. Emit deployment markers to monitoring

## DORA Metrics to Track

- Deployment frequency
- Lead time for changes
- Change failure rate
- Mean time to recovery

Use these metrics to tune pipeline risk/cycle-time tradeoffs.

## Troubleshooting Patterns

### Pipeline passes, production unhealthy

Cause:

- gate used shallow endpoint only

Fix:

- switch to deep readiness checks

### Canary never reaches 100%

Cause:

- analysis query returns no data, rollout remains inconclusive

Fix:

- set `inconclusiveLimit`, verify metric names and labels

### Production job waits forever

Cause:

- missing/invalid environment reviewer assignment

Fix:

- configure approvers in environment protection rules

### Docker build always cold

Cause:

- `COPY . .` before dependency install invalidates cache frequently

Fix:

- copy lockfiles/manifests first, then install, then copy source

### Rollback breaks due to schema drift

Cause:

- service rollback without compatible DB state

Fix:

- additive migrations first, deferred destructive changes, versioned undo scripts

## Additional Reference

- `references/advanced-strategies.md`
