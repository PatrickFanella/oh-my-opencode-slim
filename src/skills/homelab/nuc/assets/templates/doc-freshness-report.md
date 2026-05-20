---
title: "{{title}}"
created: "{{date}}"
updated: "{{date}}"
status: draft
host: nuc
type: report
---

# {{title}}

## Scope

- Docs root: `/home/onnwee/.nuc`
- Archive included: `{{archive_included}}`
- Live state timestamp: `{{live_state_timestamp}}`

## Summary

- Active markdown files checked: `{{active_markdown_files}}`
- Missing frontmatter: `{{missing_frontmatter}}`
- Missing created/updated metadata: `{{missing_metadata}}`
- Stale claim matches: `{{stale_claim_matches}}`

## Live validation

- Docker containers: `{{docker_containers}}`
- Host publish entries: `{{host_publish_entries}}`
- Wildcard publish entries: `{{wildcard_publish_entries}}`
- NUC-backed Caddy upstream ports: `{{nuc_caddy_ports}}`
- Missing live upstream publishes: `{{missing_upstream_publishes}}`

## Fixes applied

- {{fixes_applied}}

## Follow-ups

- {{follow_ups}}
