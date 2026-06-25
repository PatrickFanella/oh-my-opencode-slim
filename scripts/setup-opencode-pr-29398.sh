#!/usr/bin/env bash
set -euo pipefail

source_dir="${BLACKTOWER_OPENCODE_SOURCE_DIR:-$HOME/.local/share/blacktower/opencode}"
origin_repo="${BLACKTOWER_OPENCODE_ORIGIN_REPO:-https://github.com/PatrickFanella/opencode.git}"
upstream_repo="${BLACKTOWER_OPENCODE_UPSTREAM_REPO:-https://github.com/anomalyco/opencode.git}"
origin_branch="${BLACKTOWER_OPENCODE_ORIGIN_BRANCH:-dev}"
local_branch="${BLACKTOWER_OPENCODE_LOCAL_BRANCH:-pr-29398}"
upstream_branch="${BLACKTOWER_OPENCODE_UPSTREAM_BRANCH:-dev}"

if [ ! -d "$source_dir/.git" ]; then
  mkdir -p "$(dirname "$source_dir")"
  git clone "$origin_repo" "$source_dir"
fi

git -C "$source_dir" remote set-url origin "$origin_repo"

if git -C "$source_dir" remote get-url upstream >/dev/null 2>&1; then
  git -C "$source_dir" remote set-url upstream "$upstream_repo"
else
  git -C "$source_dir" remote add upstream "$upstream_repo"
fi

git -C "$source_dir" fetch origin "$origin_branch"
git -C "$source_dir" checkout -B "$local_branch" "origin/$origin_branch"
git -C "$source_dir" fetch upstream "$upstream_branch"
git -C "$source_dir" merge --no-edit "upstream/$upstream_branch"

bun run setup -- --opencode-source-dir="$source_dir" "$@"
