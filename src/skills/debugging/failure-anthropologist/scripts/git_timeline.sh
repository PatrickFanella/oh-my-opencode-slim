#!/usr/bin/env bash
set -euo pipefail

SINCE="${1:-24 hours ago}"
git log --since="$SINCE" --date=iso --pretty=format:'%h %ad %an %s'
