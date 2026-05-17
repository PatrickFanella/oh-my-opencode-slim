# Kubernetes Manifest Generator — Full Guide

Detailed reference moved from `SKILL.md`.

## Scope

- Deployment/Stateful workload manifests
- Services for internal/external connectivity
- ConfigMap + Secret config strategy
- PVC storage attachment
- Security hardening defaults
- Label/annotation conventions
- Validation and troubleshooting

## Requirement Gathering Checklist

- App type: stateless/stateful
- Container image and immutable tag
- Exposed ports and protocol
- Config and secret inputs
- Storage size/class/access mode
- CPU/memory requests and limits
- Health endpoints and startup behavior
- External exposure requirements

## Core Resource Patterns

## 1) Deployment

Preserved key elements:

- `apps/v1` Deployment
- `selector.matchLabels` aligned with pod template labels
- resource requests/limits
- readiness + liveness probes
- env/envFrom for ConfigMap and Secret wiring

Production defaults:

- avoid `:latest` tags
- define replica strategy by availability target

## 2) Service

Primary choices:

- `ClusterIP` for in-cluster traffic
- `LoadBalancer` for external ingress where applicable

Critical checks:

- Service selector must match pod labels
- `targetPort` must match container port name/number

## 3) ConfigMap

Use for non-sensitive config only.

Patterns:

- key/value environment settings
- full config file payloads via multiline data keys

## 4) Secret

Use for sensitive values.

Preserved guidance:

- do not commit plaintext secrets
- prefer external/sealed secret workflows
- rotate regularly and restrict via RBAC

## 5) PersistentVolumeClaim

For stateful workloads:

- define `storageClassName`, `accessModes`, `resources.requests.storage`
- mount via `volumeMounts` and `volumes`

Storage notes:

- `ReadWriteOnce` common for single-writer apps
- `ReadWriteMany` when shared multi-pod access required

## Security Hardening

Recommended pod/container security context baseline:

- `runAsNonRoot: true`
- non-root UID/GID
- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true` (where possible)
- drop all Linux capabilities
- `seccompProfile: RuntimeDefault`

## Metadata Conventions

Use Kubernetes standard labels:

- `app.kubernetes.io/name`
- `app.kubernetes.io/instance`
- `app.kubernetes.io/version`
- `app.kubernetes.io/component`
- `app.kubernetes.io/part-of`
- `app.kubernetes.io/managed-by`

Useful annotations include ownership, contact, and metrics scrape hints.

## Manifest Organization Options

### Single file, multi-doc

- One file with `---` separators

### Split files

- one resource per file (`deployment.yaml`, `service.yaml`, etc.)

### Kustomize overlays

- `base/` + `overlays/dev` + `overlays/prod`
- preferred for environment-specific differences

## Validation Workflow

Minimum checks preserved from original:

```bash
kubectl apply -f manifest.yaml --dry-run=client
kubectl apply -f manifest.yaml --dry-run=server
kubeval manifest.yaml
kube-score score manifest.yaml
kube-linter lint manifest.yaml
```

Release gate checklist:

- valid schema and API versions
- limits/requests set
- probes present and sane
- security context present
- labels/selectors consistent
- namespace assumptions explicit

## Common Deployment Patterns

### Stateless web/API service

Typically includes:

- Deployment + ClusterIP Service
- ConfigMap + Secret
- optional HPA

### Stateful data workload

Typically includes:

- StatefulSet + headless Service
- PVC template
- config + secrets

### Batch/Cron workload

Typically includes:

- Job/CronJob
- config + secrets
- service account/RBAC if needed

### Multi-container pod

Typically includes:

- app + sidecar/init containers
- shared volume contract

## Best Practices Summary (Preserved)

1. Define requests/limits
2. Add liveness/readiness probes
3. Pin image tags
4. Harden security context
5. Separate config from code via ConfigMap/Secret
6. Label all resources consistently
7. Validate before apply
8. Keep manifests versioned in Git
9. Annotate for ops context

## Troubleshooting

### Pods not starting

- inspect pod events and image pull errors
- verify cluster capacity and scheduling

### Service unreachable

- verify selector/labels and endpoints
- verify service type/port mapping

### Config not loading

- verify referenced names and namespace
- ensure ConfigMap/Secret exists before workload start

## Existing Templates and References

- `assets/deployment-template.yaml`
- `assets/service-template.yaml`
- `assets/configmap-template.yaml`
- `references/deployment-spec.md`
- `references/service-spec.md`
