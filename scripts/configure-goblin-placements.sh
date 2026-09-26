#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cat > "$project_root/src/lib/goblin-placements.ts" <<'EOF'
import { parseDateKey } from './dates';

export interface GoblinPlacement {
  x: number;
  y: number;
  scale: number;
}

export interface ProjectedGoblinPlacement {
  x: number;
  y: number;
  backgroundHeight: number;
}

export const backgroundKeys = [
  '01', '01-late', '02', '02-late', '03', '03-late',
  '04', '04-late', '05', '05-late', '06', '06-late',
  '07', '07-late', '08', '08-late', '09', '09-late',
  '10', '10-late', '11', '11-late', '12', '12-late'
] as const;

export type BackgroundKey = (typeof backgroundKeys)[number];

export const goblinPlacements: Record<BackgroundKey, readonly GoblinPlacement[]> = {
  '01': [{ x: 0.24, y: 0.85, scale: 0.54 }, { x: 0.7, y: 0.88, scale: 0.6 }],
  '01-late': [{ x: 0.3, y: 0.8, scale: 0.52 }, { x: 0.52, y: 0.72, scale: 0.42 }],
  '02': [{ x: 0.26, y: 0.84, scale: 0.55 }, { x: 0.74, y: 0.87, scale: 0.6 }],
  '02-late': [{ x: 0.23, y: 0.82, scale: 0.55 }, { x: 0.34, y: 0.7, scale: 0.42 }],
  '03': [{ x: 0.28, y: 0.82, scale: 0.58 }, { x: 0.72, y: 0.82, scale: 0.58 }],
  '03-late': [{ x: 0.35, y: 0.86, scale: 0.62 }, { x: 0.47, y: 0.7, scale: 0.44 }],
  '04': [{ x: 0.35, y: 0.82, scale: 0.55 }, { x: 0.66, y: 0.82, scale: 0.58 }],
  '04-late': [{ x: 0.5, y: 0.84, scale: 0.6 }, { x: 0.62, y: 0.75, scale: 0.48 }],
  '05': [{ x: 0.23, y: 0.76, scale: 0.48 }, { x: 0.72, y: 0.83, scale: 0.58 }],
  '05-late': [{ x: 0.3, y: 0.84, scale: 0.6 }, { x: 0.63, y: 0.78, scale: 0.52 }],
  '06': [{ x: 0.3, y: 0.43, scale: 0.23 }, { x: 0.72, y: 0.43, scale: 0.23 }],
  '06-late': [{ x: 0.3, y: 0.43, scale: 0.23 }, { x: 0.72, y: 0.43, scale: 0.23 }],
  '07': [{ x: 0.3, y: 0.43, scale: 0.23 }, { x: 0.72, y: 0.43, scale: 0.23 }],
  '07-late': [{ x: 0.3, y: 0.42, scale: 0.23 }, { x: 0.72, y: 0.42, scale: 0.23 }],
  '08': [{ x: 0.32, y: 0.56, scale: 0.32 }, { x: 0.7, y: 0.56, scale: 0.32 }],
  '08-late': [{ x: 0.3, y: 0.74, scale: 0.45 }, { x: 0.68, y: 0.58, scale: 0.34 }],
  '09': [{ x: 0.58, y: 0.85, scale: 0.62 }, { x: 0.72, y: 0.75, scale: 0.48 }],
  '09-late': [{ x: 0.72, y: 0.84, scale: 0.6 }, { x: 0.54, y: 0.74, scale: 0.48 }],
  '10': [{ x: 0.64, y: 0.84, scale: 0.6 }, { x: 0.34, y: 0.8, scale: 0.55 }],
  '10-late': [{ x: 0.68, y: 0.83, scale: 0.58 }, { x: 0.38, y: 0.8, scale: 0.54 }],
  '11': [{ x: 0.72, y: 0.83, scale: 0.6 }, { x: 0.58, y: 0.76, scale: 0.48 }],
  '11-late': [{ x: 0.5, y: 0.84, scale: 0.6 }, { x: 0.66, y: 0.76, scale: 0.48 }],
  '12': [{ x: 0.28, y: 0.84, scale: 0.58 }, { x: 0.72, y: 0.84, scale: 0.58 }],
  '12-late': [{ x: 0.72, y: 0.82, scale: 0.58 }, { x: 0.46, y: 0.74, scale: 0.46 }]
};

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function getBackgroundKey(dateKey: string): BackgroundKey {
  const { month, day } = parseDateKey(dateKey);
  return `${String(month).padStart(2, '0')}${day <= 15 ? '' : '-late'}` as BackgroundKey;
}

export function getGoblinPlacement(dateKey: string): GoblinPlacement {
  const placements = goblinPlacements[getBackgroundKey(dateKey)];
  return placements[stableIndex(`placement:${dateKey}`, placements.length)];
}

export function projectGoblinPlacement(
  placement: GoblinPlacement,
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number
): ProjectedGoblinPlacement {
  const coverScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight);
  const renderedWidth = sourceWidth * coverScale;
  const renderedHeight = sourceHeight * coverScale;
  const offsetX = (viewportWidth - renderedWidth) / 2;
  const offsetY = (viewportHeight - renderedHeight) / 2;
  return {
    x: offsetX + placement.x * renderedWidth,
    y: offsetY + placement.y * renderedHeight,
    backgroundHeight: renderedHeight
  };
}
EOF

cat > "$project_root/src/lib/goblin-overlay.ts" <<'EOF'
import { getBackgroundTheme, getGoblinOverlay, type BackgroundTheme } from './goblins';
import { getGoblinPlacement, projectGoblinPlacement } from './goblin-placements';

const goblinSceneScale = 0.34;

const themeFilters: Record<BackgroundTheme, string> = {
  winter: 'drop-shadow(0 8px 13px rgba(20, 30, 38, .3)) saturate(.88) brightness(.96)',
  spring: 'drop-shadow(0 8px 13px rgba(24, 42, 30, .25)) saturate(.92) brightness(1.02)',
  summer: 'drop-shadow(0 8px 13px rgba(18, 38, 32, .28)) saturate(.9) brightness(.98)',
  autumn: 'drop-shadow(0 8px 13px rgba(54, 31, 18, .3)) saturate(.94) sepia(.08)'
};

function mountGoblin(stage: HTMLElement): void {
  if (stage.dataset.goblinMounted === 'true') return;
  const dateKey = stage.dataset.dayPage;
  const figure = stage.querySelector<HTMLElement>('.daily-image');
  const backdrop = figure?.querySelector<HTMLImageElement>('img');
  if (!dateKey || !figure || !backdrop) return;

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
    if (!image.complete || image.naturalWidth === 0 || !backdrop.complete || backdrop.naturalWidth === 0) return;
    const width = figure.clientWidth;
    const height = figure.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const projected = projectGoblinPlacement(
      placement,
      backdrop.naturalWidth,
      backdrop.naturalHeight,
      width,
      height
    );
    const drawHeight = projected.backgroundHeight * goblin.position.scale * goblinSceneScale * placement.scale;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const groundSink = drawHeight * 0.025;

    context.save();
    context.globalAlpha = 0.2;
    context.filter = 'blur(4px)';
    context.fillStyle = '#17261d';
    context.beginPath();
    context.ellipse(projected.x, projected.y + groundSink, drawWidth * 0.3, drawHeight * 0.035, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.save();
    context.globalAlpha = 0.94;
    context.filter = themeFilters[theme];
    context.translate(projected.x, projected.y + groundSink);
    context.scale(placement.x > 0.5 ? -1 : 1, 1);
    context.drawImage(image, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    context.restore();
  };

  image.addEventListener('load', draw, { once: true });
  backdrop.addEventListener('load', draw, { once: true });
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

cat > "$project_root/tests/goblin-placements.test.ts" <<'EOF'
import { describe, expect, it } from 'vitest';
import {
  backgroundKeys,
  getBackgroundKey,
  getGoblinPlacement,
  goblinPlacements,
  projectGoblinPlacement
} from '../src/lib/goblin-placements';

describe('哥布林地形錨點', () => {
  it('24 張半月背景各有兩個安全位置', () => {
    expect(backgroundKeys).toHaveLength(24);
    for (const key of backgroundKeys) {
      const placements = goblinPlacements[key];
      expect(placements).toHaveLength(2);
      for (const placement of placements) {
        expect(placement.x).toBeGreaterThanOrEqual(0.2);
        expect(placement.x).toBeLessThanOrEqual(0.82);
        expect(placement.y).toBeGreaterThanOrEqual(0.42);
        expect(placement.y).toBeLessThanOrEqual(0.88);
        expect(placement.scale).toBeGreaterThanOrEqual(0.23);
        expect(placement.scale).toBeLessThanOrEqual(0.62);
      }
    }
  });

  it('日期會對應正確的半月背景，並穩定取得位置', () => {
    expect(getBackgroundKey('2026-01-15')).toBe('01');
    expect(getBackgroundKey('2026-01-16')).toBe('01-late');
    expect(getBackgroundKey('2026-12-31')).toBe('12-late');
    expect(getGoblinPlacement('2026-07-23')).toEqual(getGoblinPlacement('2026-07-23'));
  });

  it('依 object-fit cover 裁切投影原圖座標', () => {
    const placement = { x: 0.5, y: 0.75, scale: 0.5 };
    const uncropped = projectGoblinPlacement(placement, 1400, 900, 700, 450);
    expect(uncropped).toEqual({ x: 350, y: 337.5, backgroundHeight: 450 });

    const cropped = projectGoblinPlacement(placement, 1400, 900, 1000, 450);
    expect(cropped.x).toBeCloseTo(500);
    expect(cropped.y).toBeCloseTo(385.7142857142857);
    expect(cropped.backgroundHeight).toBeCloseTo(642.8571428571429);
  });
});
EOF

python3 - "$project_root" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
installer = root / 'scripts/install-goblin-overlays.sh'
overlay = (root / 'src/lib/goblin-overlay.ts').read_text()
text = installer.read_text()
start_marker = 'cat > "$project_root/src/lib/goblin-overlay.ts" <<\'EOF\'\n'
end_marker = '\nEOF\n\ncat > "$project_root/tests/goblins.test.ts"'
start = text.index(start_marker) + len(start_marker)
end = text.index(end_marker, start)
installer.write_text(text[:start] + overlay + text[end:])
PY

echo '已安裝 24 張背景的地形錨點、responsive cover 投影與接觸陰影。'
