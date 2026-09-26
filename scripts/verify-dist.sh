#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

[[ -f dist/index.html ]]
[[ ! -d dist/day ]]
[[ -f dist/calendar/2026/09/index.html ]]
[[ -f dist/lookup/index.html ]]
[[ -f dist/_redirects ]]
[[ -f dist/sitemap.xml ]]
[[ -f dist/api/index.json ]]
[[ -f dist/api/day/2026/09/25.json ]]
[[ -f dist/api/month/2026/09.json ]]
node -e "for (const f of process.argv.slice(1)) JSON.parse(require('fs').readFileSync(f, 'utf8'))" \
  dist/api/index.json dist/api/day/2026/09/25.json dist/api/month/2026/09.json
grep -Fxq '/day/:year/:month/:day/ /lookup/ 200' dist/_redirects
grep -Fq 'https://taiwan-perpetual-calendar.pages.dev/day/2026/09/25/' dist/sitemap.xml

forbidden_output="$(find dist -type f \( -name '_worker.js' -o -path '*/functions/*' \) -print -quit)"
if [[ -n "$forbidden_output" ]]; then
  echo 'dist 不得包含 Pages Functions 或 _worker.js。' >&2
  exit 1
fi

file_count="$(find dist -type f | wc -l | tr -d ' ')"
largest_bytes="$(find dist -type f -exec stat -f '%z' {} + | awk 'max < $1 { max = $1 } END { print max + 0 }')"
if (( file_count >= 20000 )); then
  echo "dist 檔案數 ${file_count} 超出本專案的 Pages Free 安全門檻。" >&2
  exit 1
fi
if (( largest_bytes >= 26214400 )); then
  echo "dist 單檔 ${largest_bytes} bytes 超出 25 MiB。" >&2
  exit 1
fi

echo "Pages 產物驗證通過：${file_count} 個檔案，最大單檔 ${largest_bytes} bytes。"
