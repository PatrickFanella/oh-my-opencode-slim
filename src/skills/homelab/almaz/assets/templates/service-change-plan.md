---
title: "{{service_name}} service change plan"
created: "{{date}}"
updated: "{{date}}"
status: draft
host: almaz
type: plan
---

# {{service_name}} service change plan

## Goal

{{goal}}

## Proposed placement

- Host: `{{host}}`
- Compose root: `{{compose_root}}`
- Docker network(s): `{{docker_networks}}`
- Host ports/binds: `{{host_ports}}`
- Public route(s): `{{public_routes}}`

## State and dependencies

- Persistent volumes: `{{persistent_volumes}}`
- Databases: `{{databases}}`
- Secrets/env files: `{{secret_files}}`
- Upstream/downstream callers: `{{callers}}`

## Safety plan

- Backup before change: `{{backup_plan}}`
- Rollback: `{{rollback_plan}}`
- Firewall/Caddy/Cloudflare impact: `{{network_impact}}`
- Storage/SnapRAID impact: `{{storage_impact}}`
- Monitoring/alerts: `{{monitoring_plan}}`

## Execution steps

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

## Verification

- Container health: `{{container_health_check}}`
- Local origin check: `{{origin_check}}`
- Public route check: `{{public_route_check}}`
- NVIDIA/GPU check: `{{gpu_check}}`
- Backup/docs updated: `{{docs_updated}}`

## Approval

- Approved by: `{{approved_by}}`
- Approval timestamp: `{{approval_timestamp}}`
