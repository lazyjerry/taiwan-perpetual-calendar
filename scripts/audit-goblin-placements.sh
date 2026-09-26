#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-/private/tmp/app-calendar-goblin-audit}"

cd "$project_root"
python3 /Users/lazyjerry/.ai-global/skills/webapp-testing/scripts/with_server.py \
  --server "node_modules/.bin/wrangler pages dev --ip 127.0.0.1 --port 4173" --port 4173 \
  -- python3 tests/goblin-visual-audit.py "$output_dir"
