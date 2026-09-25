#!/usr/bin/env bash
set -euo pipefail
export ASTRO_TELEMETRY_DISABLED=1
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npx astro check
npx vitest run
npx tsx scripts/validate-calendar.ts
