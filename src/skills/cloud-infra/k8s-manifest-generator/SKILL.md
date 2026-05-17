---
name: k8s-manifest-generator
description: Create production-ready Kubernetes manifests for Deployments, Services, ConfigMaps, and Secrets following best practices and security standards. Use when generating Kubernetes YAML manifests, creating K8s resources, or implementing production-grade Kubernetes configurations.
---

# Kubernetes Manifest Generator

Step-by-step activation guide for generating secure, production-ready Kubernetes manifests.

## Purpose

Create correct Kubernetes YAML for workloads, networking, config, storage, and security with production-safe defaults.

## Use This Skill When

- Creating Deployments, Services, ConfigMaps, Secrets, PVCs
- Standardizing labels/annotations and manifest layout
- Adding probes, resource limits, and security contexts
- Preparing manifests for multi-environment deployment

## Avoid This Skill When

- You need Helm chart packaging/templating as primary output (`helm-chart-scaffolding`)
- You only need advanced policy controls (`k8s-security-policies`)

## Workflow

1. **Collect workload requirements**
   - Stateless vs stateful, image/tag, ports, env/config, storage, scaling

2. **Author core workload manifest**
   - Deployment (or StatefulSet when state identity/storage is required)
   - Explicit resource requests/limits
   - Liveness + readiness probes

3. **Attach networking/resource dependencies**
   - Service type (`ClusterIP` internal, `LoadBalancer` external)
   - ConfigMap for non-secret config
   - Secret for credentials/sensitive material
   - PVC for persistent storage

4. **Apply security defaults**
   - `runAsNonRoot`, drop capabilities, `allowPrivilegeEscalation: false`
   - `readOnlyRootFilesystem` when feasible
   - Pod/container `securityContext`

5. **Standardize metadata + structure**
   - Kubernetes recommended labels (`app.kubernetes.io/*`)
   - useful annotations (ownership, scrape hints)
   - choose layout: single file, split files, or Kustomize overlays

6. **Validate before apply**
   - `kubectl --dry-run=client|server`
   - static checks (`kubeval`, `kube-score`, `kube-linter`)

## Output Checklist

- [ ] Correct resource kinds selected (Deployment/StatefulSet/Job/CronJob)
- [ ] Resource requests/limits defined
- [ ] Liveness/readiness probes configured
- [ ] ConfigMaps and Secrets separated correctly
- [ ] Security context hardened
- [ ] Labels/annotations follow conventions
- [ ] Manifests pass dry-run and lint validation

## Resources

- `references/full-guide.md` — curated detailed material moved from original SKILL
- `references/deployment-spec.md` — deep Deployment options
- `references/service-spec.md` — service/networking details
- `assets/deployment-template.yaml`
- `assets/service-template.yaml`
- `assets/configmap-template.yaml`

## Related Skills

- `helm-chart-scaffolding`
- `gitops-workflow`
- `k8s-security-policies`
