# Gitea Repo Overhaul Manifest

Run ID: `{{run_id}}`
Started: `{{started_at}}`
Scope: `{{scope}}`
Mutation mode: `{{mutation_mode}}`

## Summary

| Status | Count |
| --- | ---: |
| Green | `{{green_count}}` |
| Yellow | `{{yellow_count}}` |
| Red | `{{red_count}}` |
| Mutated successfully | `{{changed_count}}` |
| Completed with warnings | `{{warning_count}}` |
| Blocked / failed | `{{blocked_count}}` |
| Skipped | `{{skipped_count}}` |

## Repositories

| Repo | Classification | Code | Docs/Wiki | Issues | Actions | Projects | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `{{repo_full_name}}` | `{{classification}}` | `{{code_status}}` | `{{docs_status}}` | `{{issues_status}}` | `{{actions_status}}` | `{{projects_status}}` | `{{notes}}` |

## Batch results

| Repo | Labels | Roadmap issue | Protection | Wiki | Settings | Errors |
| --- | ---: | --- | --- | --- | --- | --- |
| `{{repo_full_name}}` | `{{labels_created}}` | `{{roadmap_issue}}` | `{{branch_protection_status}}` | `{{wiki_status}}` | `{{settings_status}}` | `{{errors}}` |

## Safety prechecks

- Re-read before mutation: `{{reread_before_mutation_status}}`
- Main vs master status: `{{main_vs_master_status}}`
- Actions enablement precheck: `{{actions_enablement_precheck}}`
- Existing protection preserved: `{{existing_protection_preserved}}`

## Approval queue

- [ ] `{{approval_item_1}}`

## Blockers

- `{{blocker_1}}`

## Final live verification

- Total repos: `{{total_repo_count}}`
- Defaults: `{{default_branch_counts}}`
- Missing soft protections: `{{missing_soft_protections}}`
- Missing maintenance wiki pages: `{{missing_maintenance_wikis}}`
- Repos with no labels: `{{repos_with_no_labels}}`
- Repos with no open issues: `{{repos_with_no_open_issues}}`

## Follow-up commands

```bash
{{followup_commands}}
```
