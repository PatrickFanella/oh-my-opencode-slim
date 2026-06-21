# Monthly Vault Maintenance Checklist

Use this checklist for a 15-30 minute monthly upkeep pass.

## 1. Snapshot

- [ ] `git status --short --ignored`
- [ ] `python3 <skill>/scripts/vault_monthly_check.py /home/onnwee/Documents/ars-malefica`
- [ ] `/usr/bin/git check-ignore -v .obsidian/plugins/remotely-save/data.json .obsidian/plugins/paperless/data.json`

## 2. Inbox

- [ ] Review `000 Inbox/Inbox.md`.
- [ ] Use QuickAdd buttons for rapid capture to correct destinations.
- [ ] Move actionable notes to Projects, Areas, or Resources.
- [ ] Move processed imports to `004 Archives/Imports/<date>/` with a README.
- [ ] Confirm no unmanaged markdown remains in Inbox.

## 3. Active work

- [ ] Open `001 Projects/Works/Active Work Dashboard.md`.
- [ ] Review active works.
- [ ] Review paused works.
- [ ] Review stale workbenches.
- [ ] Review Kanban boards: SubBlog Pipeline, Social Pipeline, Software Pipeline.
- [ ] Review open decisions.
- [ ] Update one next action per active project/thread.

## 4. Health dashboard

- [ ] Open `003 Resources/Systems/Vault Health Dashboard.md`.
- [ ] Fix notes missing `type`.
- [ ] Fix notes missing `status`.
- [ ] Review stale `updated` notes.
- [ ] Review notes with no outgoing links.
- [ ] Review notes with no incoming links (true orphans).
- [ ] Review source/generated queues without rewriting bodies unnecessarily.

## 5. Home dashboard

- [ ] Open `Home.md`.
- [ ] Verify stale notes query (30+ days).
- [ ] Verify orphan detection query.
- [ ] Verify recent inbox query.
- [ ] Verify upcoming deadlines query.
- [ ] Verify Thread Dashboard and Works queries.

## 6. Archive hygiene

- [ ] Identify finished or superseded work.
- [ ] Move only closed material into `004 Archives/**`.
- [ ] Add/update archive README manifests.
- [ ] Remove stale links from active dashboards.

## 7. Validation

- [ ] `/usr/bin/git diff --check`
- [ ] `python3 -m json.tool .obsidian/plugins/quickadd/data.json >/tmp/quickadd-json-check.out` if QuickAdd changed
- [ ] `python3 <skill>/scripts/vault_monthly_check.py /home/onnwee/Documents/ars-malefica --json > /tmp/vault-monthly-check.json`
- [ ] Commit intentional vault changes only.
