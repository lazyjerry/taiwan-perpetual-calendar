#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 31 ]]; then
  echo "用法：$0 <01.png> <02.png> ... <31.png>" >&2
  exit 2
fi

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
destination="$project_root/public/images/goblins"
mkdir -p "$destination"

command -v cwebp >/dev/null 2>&1 || {
  echo '找不到 cwebp，無法安裝哥布林圖片。' >&2
  exit 1
}

for day in $(seq -w 1 31); do
  position=$((10#$day))
  source_file="${!position}"
  if [[ ! -f "$source_file" ]]; then
    echo "找不到第 $day 張哥布林圖片：$source_file" >&2
    exit 1
  fi
  if command -v sips >/dev/null 2>&1 && ! sips -g hasAlpha "$source_file" | grep -q 'hasAlpha: yes'; then
    echo "第 $day 張圖片沒有 Alpha channel：$source_file" >&2
    exit 1
  fi
  cwebp -quiet -q 82 -alpha_q 92 -resize 512 0 "$source_file" -o "$destination/$day.webp"
done

tmp_data="$(mktemp)"
trap 'rm -f "$tmp_data"' EXIT

x_positions=(0.22 0.78 0.28 0.72 0.18 0.82 0.34 0.66 0.24 0.76 0.30 0.70 0.20 0.80 0.36 0.64 0.25 0.75 0.32 0.68 0.19 0.81 0.27 0.73 0.23 0.77 0.35 0.65 0.29 0.71 0.50)
scales=(1.02 0.98 1.04 1.00 0.96 1.03 0.99 1.01 0.97 1.04 1.00 0.98 1.03 0.99 1.01 0.96 1.04 1.00 0.98 1.02 0.97 1.03 0.99 1.01 0.96 1.02 0.98 1.04 1.00 0.97 0.92)
actions=(
  "動作 01" "動作 02" "動作 03" "動作 04" "動作 05" "動作 06" "動作 07"
  "動作 08" "動作 09" "動作 10" "動作 11" "動作 12" "動作 13" "動作 14"
  "動作 15" "動作 16" "動作 17" "動作 18" "動作 19" "動作 20" "動作 21"
  "蹲著看地圖" "躡手躡腳" "掃落葉" "提燈探路" "提著野菇籃" "盤腿喝水"
  "單腳平衡" "吹木笛" "拋橡實" "蜷身熟睡"
)

printf '[\n' > "$tmp_data"
for index in $(seq 0 30); do
  day=$(printf '%02d' "$((index + 1))")
  flip=false
  if (( index % 2 == 1 )); then
    flip=true
  fi
  comma=','
  if (( index == 30 )); then
    comma=''
  fi
  printf '  {"id":%d,"image":"/images/goblins/%s.webp","action":"%s","position":{"x":%s,"y":0.98,"scale":%s,"flip":%s},"backgrounds":["winter","spring","summer","autumn"]}%s\n' \
    "$((index + 1))" "$day" "${actions[$index]}" "${x_positions[$index]}" "${scales[$index]}" "$flip" "$comma" >> "$tmp_data"
done
printf ']\n' >> "$tmp_data"
mv "$tmp_data" "$project_root/data/goblins.json"
trap - EXIT

cat > "$project_root/src/lib/goblins.ts" <<'EOF'
import goblins from '../../data/goblins.json';
import { parseDateKey } from './dates';

export type BackgroundTheme = 'winter' | 'spring' | 'summer' | 'autumn';
export type GoblinOverlay = (typeof goblins)[number];

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function getBackgroundTheme(dateKey: string): BackgroundTheme {
  const { month } = parseDateKey(dateKey);
  if (month <= 2 || month === 12) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

export function getGoblinOverlay(dateKey: string): GoblinOverlay {
  const theme = getBackgroundTheme(dateKey);
  const candidates = goblins.filter((goblin) => goblin.backgrounds.includes(theme));
  if (candidates.length === 0) {
    throw new RangeError(`找不到可搭配 ${theme} 背景的哥布林圖片。`);
  }
  return candidates[stableIndex(`goblin:${dateKey}`, candidates.length)];
}
EOF

cat > "$project_root/src/lib/goblin-overlay.ts" <<'EOF'
import { getBackgroundTheme, getGoblinOverlay, type BackgroundTheme } from './goblins';
import { getGoblinPlacement } from './goblin-placements';

const goblinSceneScale = 0.34;

const themeFilters: Record<BackgroundTheme, string> = {
  winter: 'drop-shadow(0 10px 16px rgba(20, 30, 38, .34)) saturate(.88) brightness(.96)',
  spring: 'drop-shadow(0 10px 16px rgba(24, 42, 30, .28)) saturate(.92) brightness(1.02)',
  summer: 'drop-shadow(0 12px 18px rgba(18, 38, 32, .32)) saturate(.9) brightness(.98)',
  autumn: 'drop-shadow(0 12px 18px rgba(54, 31, 18, .34)) saturate(.94) sepia(.08)'
};

function mountGoblin(stage: HTMLElement): void {
  if (stage.dataset.goblinMounted === 'true') return;
  const dateKey = stage.dataset.dayPage;
  const figure = stage.querySelector<HTMLElement>('.daily-image');
  if (!dateKey || !figure) return;

  stage.dataset.goblinMounted = 'true';
  const goblin = getGoblinOverlay(dateKey);
  const placement = getGoblinPlacement(dateKey);
  const theme = getBackgroundTheme(dateKey);
  const canvas = document.createElement('canvas');
  canvas.className = 'daily-goblin-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;z-index:1;width:100%;height:100%;pointer-events:none';
  figure.append(canvas);

  const image = new Image();
  image.decoding = 'async';
  image.src = goblin.image;

  const draw = () => {
    if (!image.complete || image.naturalWidth === 0) return;
    const width = figure.clientWidth;
    const height = figure.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalAlpha = 0.94;
    context.filter = themeFilters[theme];

    const drawHeight = height * goblin.position.scale * goblinSceneScale * placement.scale;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const centerX = width * placement.x;
    const bottomY = height * placement.y;
    context.save();
    context.translate(centerX, bottomY);
    context.scale(placement.x > 0.5 ? -1 : 1, 1);
    context.drawImage(image, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    context.restore();
  };

  image.addEventListener('load', draw, { once: true });
  new ResizeObserver(draw).observe(figure);
}

function mountExisting(): void {
  document.querySelectorAll<HTMLElement>('[data-day-page]').forEach(mountGoblin);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountExisting, { once: true });
} else {
  mountExisting();
}

new MutationObserver(mountExisting).observe(document.documentElement, { childList: true, subtree: true });
EOF

cat > "$project_root/tests/goblins.test.ts" <<'EOF'
import { describe, expect, it } from 'vitest';
import goblins from '../data/goblins.json';
import { getBackgroundTheme, getGoblinOverlay } from '../src/lib/goblins';

describe('每日哥布林疊圖', () => {
  it('包含 31 張連號且不重複的圖片', () => {
    expect(goblins).toHaveLength(31);
    expect(goblins.map((goblin) => goblin.id)).toEqual(Array.from({ length: 31 }, (_, index) => index + 1));
    expect(new Set(goblins.map((goblin) => goblin.image)).size).toBe(31);
  });

  it('位置與縮放值都在可繪製範圍', () => {
    for (const goblin of goblins) {
      expect(goblin.position.x).toBeGreaterThanOrEqual(0);
      expect(goblin.position.x).toBeLessThanOrEqual(1);
      expect(goblin.position.y).toBeGreaterThanOrEqual(0);
      expect(goblin.position.y).toBeLessThanOrEqual(1);
      expect(goblin.position.scale).toBeGreaterThan(0);
      expect(goblin.backgrounds).not.toHaveLength(0);
    }
  });

  it('同一日期固定取得同一張且符合季節背景', () => {
    const date = '2026-09-26';
    const first = getGoblinOverlay(date);
    expect(getGoblinOverlay(date)).toEqual(first);
    expect(first.backgrounds).toContain(getBackgroundTheme(date));
  });

  it.each([
    ['2026-01-15', 'winter'],
    ['2026-04-15', 'spring'],
    ['2026-07-15', 'summer'],
    ['2026-10-15', 'autumn']
  ] as const)('%s 使用 %s 背景分類', (date, theme) => {
    expect(getBackgroundTheme(date)).toBe(theme);
  });
});
EOF

lookup="$project_root/src/pages/lookup.astro"
if ! grep -q "import '../lib/goblin-overlay';" "$lookup"; then
  perl -0pi -e "s#import \{ getDailyContent \} from '../lib/content';#import { getDailyContent } from '../lib/content';\n  import '../lib/goblin-overlay';#" "$lookup"
fi

echo '已安裝 31 張哥布林 WebP、資料欄位、canvas 疊圖程式與測試。'
