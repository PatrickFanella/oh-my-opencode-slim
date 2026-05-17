# Helm Chart Scaffolding Full Guide

Detailed reference moved from `SKILL.md`. Use this when you need implementation depth, not activation summary.

## Helm Overview

Helm acts as a Kubernetes package manager for:

- Templating and reusing manifests
- Release lifecycle (install/upgrade/rollback)
- Dependency management
- Environment-specific config via values overlays

## End-to-End Workflow

### 1) Initialize chart

```bash
helm create my-app
```

Baseline structure:

```text
my-app/
├── Chart.yaml
├── values.yaml
├── charts/
├── templates/
│   ├── NOTES.txt
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── tests/test-connection.yaml
└── .helmignore
```

### 2) Configure `Chart.yaml`

Key fields:

- `apiVersion: v2`
- `name`, `description`, `type: application`
- `version` (chart) and `appVersion` (app)
- `maintainers`, `sources`, `home`, `icon`
- `dependencies` with explicit versions and conditions

Example dependency block:

```yaml
dependencies:
  - name: postgresql
    version: "12.0.0"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled
```

Use `../assets/Chart.yaml.template` as reference.

### 3) Design `values.yaml`

Recommended grouping:

- `image` (repo/tag/pullPolicy)
- `replicaCount`
- `service` / `ingress`
- `resources` / `autoscaling`
- runtime env/config blocks
- subchart config (e.g., `postgresql`, `redis`)

Use `../assets/values.yaml.template` for complete layout.

### 4) Author templates safely

Core patterns:

- helper-based names/labels
- conditionals for optional resources
- list iteration for env/items
- `toYaml | nindent` for nested blocks

Deployment pattern snippet:

```yaml
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
```

### 5) Build robust helpers (`templates/_helpers.tpl`)

Define:

- chart name
- full release name
- selector labels
- common labels

Use truncation/suffix trimming for DNS-safe names (63 chars).

### 6) Manage dependencies

```bash
helm dependency update
helm dependency build
```

Override subchart values in root values files:

```yaml
postgresql:
  enabled: true
  auth:
    database: myapp
    username: myapp
```

### 7) Validate chart

```bash
helm lint my-app/
helm template my-app ./my-app
helm template my-app ./my-app -f values-prod.yaml
helm install my-app ./my-app --dry-run --debug
helm show values ./my-app
```

Optional scripted check: `../scripts/validate-chart.sh`.

### 8) Package and publish

```bash
helm package my-app/
helm repo index .
```

Then publish `*.tgz` + `index.yaml` to your chart host (S3, static site, artifact registry).

### 9) Multi-environment rollout

Keep overlays:

- `values-dev.yaml`
- `values-staging.yaml`
- `values-prod.yaml`

Install with overlay:

```bash
helm install my-app ./my-app -f values-prod.yaml --namespace production
```

### 10) Hooks and chart tests

- Pre-install jobs for bootstrap tasks
- `helm.sh/hook: test` pods for health checks

Run tests:

```bash
helm test my-app
```

## Common Template Patterns

### Conditional resources

```yaml
{{- if .Values.ingress.enabled }}
kind: Ingress
{{- end }}
```

### List iteration

```yaml
env:
{{- range .Values.env }}
- name: {{ .name }}
  value: {{ .value | quote }}
{{- end }}
```

### Include file contents

```yaml
data:
  config.yaml: |
    {{- .Files.Get "config/application.yaml" | nindent 4 }}
```

### Global values usage

```yaml
image: {{ .Values.global.imageRegistry }}/{{ .Values.image.repository }}
```

## Best Practices

1. Version chart/app semantically
2. Keep values documented and stable
3. Use helpers for repeated naming/labels
4. Pin dependency versions
5. Gate optional resources with booleans
6. Validate in all target overlays
7. Keep naming convention lowercase-hyphen
8. Include meaningful `NOTES.txt`

## Troubleshooting

Template/debug issues:

```bash
helm template my-app ./my-app --debug
```

Dependency issues:

```bash
helm dependency update
helm dependency list
```

Install failures:

```bash
helm install my-app ./my-app --dry-run --debug
kubectl get events --sort-by='.lastTimestamp'
```

## Related Skills

- `k8s-manifest-generator`
- `gitops-workflow`
