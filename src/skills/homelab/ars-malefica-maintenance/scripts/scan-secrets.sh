#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf '%s\n' 'not inside a git repo' >&2
  exit 1
fi

pattern='(ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|BEGIN (RSA|OPENSSH) PRIVATE KEY)'

if git diff --cached -U0 --text -- . ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.pdf' ':!skills/ars-malefica-maintenance/scripts/scan-secrets.sh' | rg -n "$pattern"; then
  printf '%s\n' 'suspicious secret-like text in staged diff' >&2
  exit 1
fi

printf '%s\n' 'staged diff secret scan ok'
