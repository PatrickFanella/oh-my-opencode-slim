# NUC service map

Use this as a compact memory aid. Refresh from live Docker/Compose before making operational claims.

## Compose projects last verified on NUC

| Compose project | Running containers at audit | Notes |
| --- | ---: | --- |
| `artemis` | 2 | project app |
| `cutroom` | 1 | project app |
| `dash` | 1 | legacy-named `almaz-dash`; belongs on NUC |
| `dev` | 7 | development/admin utilities |
| `galdr` | 2 | project app |
| `lifestyle` | 1 | app group |
| `management` | 2 | includes `dashy` dashboard UI |
| `monitoring` | 15 | Prometheus/Grafana/Loki/exporters/alerting stack |
| `patchwork` | 4 | project app |
| `patrickfanella` | 2 | project app |
| `productivity` | 10 | Actual, Paperless, FreshRSS, Karakeep, Linkwarden, Vaultwarden, etc. |
| `projects` | 2 | project-level shared services |
| `subcult-corp` | 4 | project stack |
| `subcult-tv` | 2 | project stack |
| `subcults` | 3 | project stack |

## Docker networks last verified on NUC

`backups`, `bridge`, `cloud`, `dev`, `host`, `lifestyle`, `management`, `media`, `monitoring`, `none`, `productivity`, `projects`.

Docker bridge ranges were observed across `172.17.0.0/16` through `172.26.0.0/16`.

## Important naming distinctions

- `dashy`: management dashboard UI service under `/srv/server/management`.
- `dash` compose project: canonical root `/srv/server/projects/dash`.
- `almaz-dash`: container/app name with legacy naming; keep it on `nuc` unless a deliberate plan says otherwise.
- `n8n`: active service on `almaz`; any NUC n8n compose definition is dormant historical/config context.

## Route/exposure expectations

- Public/admin app ports bind to `10.0.0.56`, then are reached through `almaz` Caddy/Cloudflare/Authelia as appropriate.
- DB host ports bind to `127.0.0.1`; do not document them as LAN-exposed unless live state proves otherwise.
- Direct LAN access to protected app/admin/data ports should be blocked except allowed paths such as `almaz` origin access and Gitea SSH `2222` from LAN.

## Placement heuristics

Keep on `almaz`:

- `cloudflared`, `caddy`, `authelia`, `wg-easy`, `technitium`
- media/download/storage-heavy services: Plex, Radarr, Sonarr, Prowlarr, Lidarr, Bazarr, qBittorrent/Gluetun, Immich, borgmatic, Tdarr, Beets/Navidrome
- `n8n`

Keep on `nuc`:

- subcult/subcult-tv/subcult-corp stacks
- patchwork, artemis, galdr, patrickfanella, cutroom
- Actual Budget, Paperless, CouchDB, FreshRSS, Karakeep, Linkwarden, Vaultwarden
- Gitea, Postgres, MinIO, registry, Umami
- most exporters and observability services

Consider duplicating rather than migrating:

- lightweight monitoring from `almaz`
- DNS fallback/secondary behavior
- critical alert paths that should survive a NUC outage
