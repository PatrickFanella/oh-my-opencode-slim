# NUC topology reference

Last verified from live audit: 2026-05-18T19:01Z. Refresh live state before critical operations.

## Host roles

| Host | Address | Role | Keep here |
| --- | --- | --- | --- |
| `nuc` | `10.0.0.56` | Internal Docker app/data/dashboard host | project apps, productivity apps, monitoring stack, databases, dashboard |
| `almaz` | `10.0.0.200` | Public edge/security/storage/media/automation host | Caddy, cloudflared, Authelia, wg-easy, Technitium, media stack, Immich, n8n |

Recommended traffic shape:

```text
Internet → Cloudflare Tunnel/Caddy/Authelia on almaz → app containers on nuc
```

Do not broadly rebalance services. Prefer resilience duplication for monitoring/DNS over moving stateful apps.

## NUC baseline

- Hostname: `nuc`
- OS: Ubuntu 26.04 LTS
- Kernel at audit: `7.0.0-15-generic`
- Hardware: Intel NUC6i5SYB
- Firmware: `SYSKLi35.86A.0073.2020.0909.1625`
- LAN interface: `eno1` with `10.0.0.56/24`
- Default route and DNS route: via `10.0.0.200`
- Tailscale: interface present but logged out/no current Tailscale IP at audit
- Docker: 60 running containers, 62 image IDs, 41 host-publish entries, 0 wildcard publishes at audit
- Storage at audit: root `/dev/sdb2` 223G/75G used; `/srv` `/dev/sda` 458G/35G used; efivarfs 97% used

## Current security posture

- UFW active: default deny incoming, allow outgoing, deny routed.
- UFW allows host 22/80/443 only for IPv4/IPv6.
- Docker app/admin/data ports bind explicitly to `10.0.0.56`; DB host ports bind to `127.0.0.1`.
- `nuc-docker-user-policy.service` installs persistent guard chains after Docker/UFW.
- `DOCKER-USER` jumps to `NUC-DOCKER-GUARD`.
- `INPUT` jumps to `NUC-HOST-PORT-GUARD`.
- Guard allows established traffic, allows `almaz` to reach protected NUC TCP ports, allows LAN to reach Gitea SSH `2222`, and drops other direct access to protected ports.

## Edge routing

- Active Almaz Caddyfile: `/opt/server/management/config/caddy/Caddyfile` on `almaz`.
- Last audited Caddy inventory: 58 top-level host blocks, 26 NUC-backed host blocks, 35 unique NUC upstream ports.
- Last audited upstream comparison: all 35 Caddy NUC upstream ports had live Docker publishes on `nuc`; missing ports: none.
- HTTPS smoke at audit: 26 NUC-backed hostnames had no network failures; 25 returned `200`, `obsidian.subcult.tv` returned expected `401`.

## Placement decisions

- Keep `n8n` on `almaz`; NUC definitions are dormant unless a deliberate migration is planned.
- Keep `almaz-dash` on `nuc`; treat `almaz-dash` as legacy naming for a homelab/dashboard app.
- Keep media, Immich, downloads, edge ingress, DNS primary, and automation on `almaz`.
- Keep NUC project/productivity/data/monitoring services on `nuc` unless evidence shows a targeted move is safer.

## Active documentation anchors

- Hub: `/home/onnwee/.nuc/NUC Hub.md`
- NUC inventory: `/home/onnwee/.nuc/10-inventory/nuc.md`
- Compose source of truth: `/home/onnwee/.nuc/10-inventory/compose-source-of-truth.md`
- Docker ports: `/home/onnwee/.nuc/20-operations/docker-port-matrix.md`
- n8n/ntfy state: `/home/onnwee/.nuc/20-operations/n8n-ntfy-current-state.md`
- Secrets inventory: `/home/onnwee/.nuc/20-operations/secrets-inventory.md`
- Remaining work: `/home/onnwee/.nuc/30-plans/2026-05-17-remaining-work-tracker.md`
- Add-service runbook: `/home/onnwee/.nuc/40-runbooks/add-new-service.md`
- Freshness report: `/home/onnwee/.nuc/50-reports/docs-freshness.md`
