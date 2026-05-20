# Almaz service map

Use this as a compact memory aid. Refresh from live Docker/Compose before making operational claims.

## Compose projects last verified on almaz

| Compose root | Role | Representative running containers |
| --- | --- | --- |
| `/opt/server/management` | edge/admin/security | `caddy`, `authelia`, `technitium`, `wg-easy`, `portainer`, `watchtower` |
| `/opt/server/projects` | retained almaz projects/shared services | `cloudflared`, `opensearch`, `projects-redis`, `pg17-clustr`, `clustr-api`, `clipper-*` |
| `/opt/server/dev` | almaz dev/automation/GPU-adjacent services | `postgres`, `n8n`, `ollama` |
| `/opt/server/cloud` | Immich | `immich-server`, `immich-ml`, `immich-db`, `immich-redis` |
| `/opt/server/media` | media/download/library | `plex`, `radarr`, `sonarr`, `lidarr`, `prowlarr`, `bazarr`, `qbittorrent`, `gluetun`, `navidrome`, `tdarr`, `beets`, `maloja`, `multi-scrobbler`, `seerr`, `shelfmark`, `magiclists`, `flaresolverr` |
| `/opt/server/monitoring` | almaz host exporters/agents | `alloy`, `node-exporter`, `cadvisor`, `glances`, exporters, `scrutiny`, `docker-socket-proxy` |
| `/opt/server/backups` | backup services | `borgmatic` |

Removed/migrated top-level stacks from almaz during cleanup: `productivity`, `lifestyle`, `monitoring.bak` data directories. Do not recreate them unless requested.

## Important placement decisions

Keep on `almaz`:

- `cloudflared`, `caddy`, `authelia`, `wg-easy`, `technitium`
- media/download/storage-heavy services
- Immich and CUDA/ML helpers
- `n8n`, `ollama`, Tdarr/GPU work
- SnapRAID/MergerFS and almaz host monitoring/exporters
- router restic backup for almaz-critical state

Keep on `nuc`:

- productivity apps such as Actual, Paperless, FreshRSS, Karakeep, Linkwarden, Vaultwarden
- project/productivity/dashboard/data services migrated to nuc
- most dashboard/aggregation and internal app workloads

## Fragile services

Check after kernel, Docker, NVIDIA, or image updates:

- `wg-easy`: requires `/lib/modules:/lib/modules:ro`; module/netfilter failures can cause restart loops.
- `immich-*`: app, ML CUDA, Postgres, Redis all need to be healthy together.
- `tdarr`: verify actual processing and GPU/runtime behavior, not just container running.
- `ollama`: host service and/or container context; verify service and GPU visibility.
- `nvidia-container-toolkit`: verify package and GPU container runtime if GPU containers break.

## Network/routing expectations

- Cloudflared mostly forwards public HTTP(S) hostnames to `caddy:80`.
- `edda.subcult.tv` currently bypasses almaz Caddy and routes to `https://172.27.0.20:443` with host header/origin settings for nuc.
- WireGuard UDP `51820` is direct host binding and is not carried by Cloudflare Tunnel.
- Caddy has host ports 80/443 bound and proxies across Docker networks.

## Backups

- Primary current backup: restic to router USB via `almaz-router-restic-backup.timer`.
- Borgmatic is present but needs cleanup before trusting it: stale lock, migrated DB entries, plaintext credentials in YAML.
