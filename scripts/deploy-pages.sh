#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"

wrangler="$project_root/node_modules/.bin/wrangler"
if [[ ! -x "$wrangler" ]]; then
  echo '找不到專案固定版本的 Wrangler，請先執行 npm ci。' >&2
  exit 1
fi

bash scripts/verify-dist.sh

branch="${PAGES_BRANCH:-main}"
arguments=(pages deploy dist --project-name taiwan-perpetual-calendar --branch "$branch")
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  arguments+=(--commit-hash "$(git rev-parse HEAD)")
  arguments+=(--commit-message "$(git log -1 --pretty=%s)")
fi

exec "$wrangler" "${arguments[@]}"
