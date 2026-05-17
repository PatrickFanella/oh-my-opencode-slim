---
name: helm-chart-scaffolding
description: Design, organize, and manage Helm charts for templating and packaging Kubernetes applications with reusable configurations. Use when creating Helm charts, packaging Kubernetes applications, or implementing templated deployments.
---

# Helm Chart Scaffolding

Build production-ready Helm charts with clear values contracts, reusable templates, and safe validation/release flow.

## Purpose

Use this skill to scaffold, structure, validate, and package Helm charts for repeatable Kubernetes deployment.

## When to Use This Skill

- Creating a chart from scratch or hardening `helm create` output
- Adding template helpers, conditional resources, and env overlays
- Managing chart dependencies and subchart values
- Packaging and publishing charts to a repository

## When Not to Use

- One-off raw manifests are enough (use `k8s-manifest-generator`)
- You need GitOps controller policy design, not chart authoring

## Workflow

1. **Scaffold + normalize**
   - `helm create <chart-name>`
   - Remove unused templates, keep helpers and tests
2. **Define chart contract**
   - Complete `Chart.yaml` metadata
   - Pin dependency versions and use `condition` flags
3. **Design values model**
   - Group by domain (`image`, `service`, `ingress`, `resources`, `autoscaling`, subcharts)
   - Keep defaults safe and predictable
4. **Implement templates**
   - Use helpers for names/labels
   - Use `if`, `range`, `.Files.Get`, and `toYaml | nindent`
5. **Manage dependencies**
   - `helm dependency update`
   - Validate dependency toggles through values
6. **Validate before release**
   - `helm lint <chart>`
   - `helm template <release> <chart> --debug`
   - `helm install <release> <chart> --dry-run --debug`
7. **Prepare environment overlays**
   - Maintain `values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml`
   - Install/upgrade with explicit `-f` files and namespace
8. **Package + distribute**
   - `helm package <chart>`
   - `helm repo index .` and publish artifacts

## Output Checklist

- [ ] `Chart.yaml` metadata complete and versions coherent
- [ ] Values structure documented and stable
- [ ] Templates render with default + env overlays
- [ ] Optional resources gated via conditions
- [ ] Dependencies resolve and can be toggled
- [ ] Lint/template/dry-run checks pass
- [ ] Packaged chart installs cleanly

## Resources

- Full guide: `references/full-guide.md`
- Structure deep dive: `references/chart-structure.md`
- Chart metadata template: `assets/Chart.yaml.template`
- Values template: `assets/values.yaml.template`
- Validation script: `scripts/validate-chart.sh`

## Related Skills

- `k8s-manifest-generator` - For creating base Kubernetes manifests
- `gitops-workflow` - For automated Helm chart deployments
