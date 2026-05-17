---
name: deployment-pipeline-design
description: Design multi-stage CI/CD pipelines with approval gates, security checks, and deployment orchestration. Use this skill when designing zero-downtime deployment pipelines, implementing canary rollout strategies, setting up multi-environment promotion workflows, or debugging failed deployment gates in CI/CD.
---

# Deployment Pipeline Design

Architecture patterns for CI/CD stage design, promotion gates, progressive delivery, and rollback-safe production releases.

## Purpose

Design deployment pipelines that maximize delivery speed without sacrificing safety, recoverability, or compliance.

## Use This Skill When

- Creating multi-stage CI/CD for new services
- Adding security/quality gates between environments
- Implementing canary, blue-green, or rolling rollouts
- Defining approval flows (manual + metric-based)
- Debugging failed promotion or rollback behavior

## Avoid This Skill When

- You only need workflow syntax details for one CI vendor
- You only need Kubernetes manifest authoring (use `k8s-manifest-generator`)

## Workflow

1. **Define constraints**
   - Runtime/platform, environment topology, downtime tolerance
   - Compliance gates (SAST/DAST/SCA), approver requirements
   - Monitoring source for auto-promotion decisions

2. **Design stage flow**
   - Build -> Test -> Staging Deploy -> Integration -> Approval -> Production -> Verify
   - Fail fast early; parallelize independent jobs
   - Promote immutable artifacts across environments

3. **Select deployment strategy**
   - Rolling: default stateless path
   - Blue-green: instant rollback, higher temporary cost
   - Canary: gradual traffic + metric decisions
   - Feature flags: release control independent of deploy

4. **Implement gates**
   - Manual approvers for high-risk environments
   - Time windows/change freezes where needed
   - Automated metric gates (error rate/latency/SLO)

5. **Add verification + rollback**
   - Deep readiness checks (DB/cache/queue), not shallow ping-only checks
   - Auto rollback on health/metric threshold failure
   - Manual rollback runbook + revision commands

6. **Harden operations**
   - Cache build dependencies/layers
   - Keep env parity between staging and prod
   - Annotate deploys in observability stack
   - Track DORA metrics continuously

## Output Checklist

- [ ] Pipeline stage graph and dependencies documented
- [ ] Promotion gates (manual/automated) defined per environment
- [ ] Rollout strategy selected with rollback plan
- [ ] Deep post-deploy verification in place
- [ ] Automated rollback triggers defined
- [ ] Artifact promotion strategy is immutable/build-once
- [ ] Secrets handling and compliance scans integrated
- [ ] DORA metric instrumentation defined

## Resources

- `references/full-guide.md` — curated detailed guidance moved from original SKILL
- `references/advanced-strategies.md` — advanced vendor/platform examples

## Related Skills

- `github-actions-templates`
- `gitlab-ci-patterns`
- `secrets-management`
