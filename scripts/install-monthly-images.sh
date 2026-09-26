#!/usr/bin/env bash
set -euo pipefail

half="early"
if [[ ${1:-} == "--half" ]]; then
  half="${2:-}"
  shift 2
fi

if [[ "$half" != "early" && "$half" != "late" ]]; then
  echo "半月必須是 early 或 late：$half" >&2
  exit 2
fi

if [[ $# -ne 12 ]]; then
  echo "用法：$0 [--half early|late] <01.png> <02.png> ... <12.png>" >&2
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
  suffix=""
  if [[ "$half" == "late" ]]; then
    suffix="-late"
  fi
  cwebp -quiet -q 84 -resize 1400 0 "$source_file" -o "$destination/$month$suffix.webp"
done

echo "已安裝十二張 $half 月份影像到 public/images/daily/months/。"
