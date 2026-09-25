#!/usr/bin/env bash
set -euo pipefail
export ASTRO_TELEMETRY_DISABLED=1
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root"
python3 /Users/lazyjerry/.ai-global/skills/webapp-testing/scripts/with_server.py \
  --server "npm run preview -- --host 127.0.0.1 --port 4173" --port 4173 \
  -- python3 tests/e2e.py
