#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 12 ]]; then
  echo "用法：$0 <01.png> <02.png> ... <12.png>" >&2
  exit 2
fi

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
destination="$project_root/public/images/daily/months"
mkdir -p "$destination"

for month in $(seq -w 1 12); do
  position=$((10#$month))
  source_file="${!position}"
  if [[ ! -f "$source_file" ]]; then
    echo "找不到 $month 月影像：$source_file" >&2
    exit 1
  fi
  cwebp -quiet -q 84 -resize 1400 0 "$source_file" -o "$destination/$month.webp"
done

echo "已安裝十二張月份影像到 public/images/daily/months/。"
