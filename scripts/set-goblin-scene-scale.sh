#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^0\.[0-9]{1,2}$ ]]; then
  echo "用法：$0 <0.10 到 0.60 的縮放比例>" >&2
  exit 2
fi

scale="$1"
awk -v scale="$scale" 'BEGIN { exit !(scale >= 0.10 && scale <= 0.60) }' || {
  echo '縮放比例必須介於 0.10 與 0.60 之間。' >&2
  exit 2
}

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
overlay="$project_root/src/lib/goblin-overlay.ts"
installer="$project_root/scripts/install-goblin-overlays.sh"

for file in "$overlay" "$installer"; do
  if ! grep -q 'const goblinSceneScale = ' "$file"; then
    perl -0pi -e 's/(const themeFilters: Record<BackgroundTheme, string> = \{)/const goblinSceneScale = 1;\n\n$1/' "$file"
  fi
  SCALE="$scale" perl -0pi -e 's/const goblinSceneScale = [0-9.]+;/const goblinSceneScale = $ENV{SCALE};/g; s/const drawHeight = height \* goblin\.position\.scale;/const drawHeight = height * goblin.position.scale * goblinSceneScale;/g' "$file"
done

echo "已將哥布林場景縮放比例設為 ${scale}。"
