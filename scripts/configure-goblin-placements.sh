#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cat > "$project_root/src/lib/goblin-placements.ts" <<'EOF'
import { getBackgroundTheme, type BackgroundTheme } from './goblins';

export interface GoblinPlacement {
  x: number;
  y: number;
  scale: number;
}

export const goblinPlacements: Record<BackgroundTheme, readonly GoblinPlacement[]> = {
  winter: [
    { x: 0.82, y: 0.97, scale: 1 },
    { x: 0.26, y: 0.86, scale: 0.72 },
    { x: 0.68, y: 0.85, scale: 0.68 },
    { x: 0.52, y: 0.74, scale: 0.48 }
  ],
  spring: [
    { x: 0.82, y: 0.97, scale: 0.96 },
    { x: 0.2, y: 0.88, scale: 0.7 },
    { x: 0.72, y: 0.84, scale: 0.68 },
    { x: 0.48, y: 0.76, scale: 0.5 }
  ],
  summer: [
    { x: 0.14, y: 0.7, scale: 0.4 },
    { x: 0.4, y: 0.66, scale: 0.38 },
    { x: 0.66, y: 0.67, scale: 0.4 },
    { x: 0.86, y: 0.8, scale: 0.58 }
  ],
  autumn: [
    { x: 0.82, y: 0.97, scale: 1 },
    { x: 0.28, y: 0.85, scale: 0.68 },
    { x: 0.66, y: 0.86, scale: 0.72 },
    { x: 0.52, y: 0.75, scale: 0.5 }
  ]
};

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function getGoblinPlacement(dateKey: string): GoblinPlacement {
  const placements = goblinPlacements[getBackgroundTheme(dateKey)];
  return placements[stableIndex(`placement:${dateKey}`, placements.length)];
}
EOF

cat > "$project_root/tests/goblin-placements.test.ts" <<'EOF'
import { describe, expect, it } from 'vitest';
import { getGoblinPlacement, goblinPlacements } from '../src/lib/goblin-placements';

describe('哥布林場景錨點', () => {
  it('四季都有近、中、遠景的多個安全位置', () => {
    for (const placements of Object.values(goblinPlacements)) {
      expect(placements.length).toBeGreaterThanOrEqual(4);
      expect(new Set(placements.map(({ x }) => x)).size).toBeGreaterThanOrEqual(4);
      expect(new Set(placements.map(({ y }) => y)).size).toBeGreaterThanOrEqual(3);
      for (const placement of placements) {
        expect(placement.x).toBeGreaterThanOrEqual(0.1);
        expect(placement.x).toBeLessThanOrEqual(0.9);
        expect(placement.y).toBeGreaterThanOrEqual(0.6);
        expect(placement.y).toBeLessThanOrEqual(0.98);
        expect(placement.scale).toBeGreaterThan(0.3);
        expect(placement.scale).toBeLessThanOrEqual(1);
      }
    }
  });

  it('位置依日期固定，且每季一個月內會出現多種構圖', () => {
    for (const month of [1, 4, 7, 10]) {
      const keys = Array.from({ length: 28 }, (_, index) => `2026-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`);
      const placements = keys.map(getGoblinPlacement);
      expect(getGoblinPlacement(keys[0])).toEqual(placements[0]);
      expect(new Set(placements.map(({ x, y }) => `${x}:${y}`)).size).toBe(4);
    }
  });

  it('越遠的錨點不會比近景角色大', () => {
    for (const placements of Object.values(goblinPlacements)) {
      const byDistance = [...placements].sort((left, right) => left.y - right.y);
      for (let index = 1; index < byDistance.length; index += 1) {
        expect(byDistance[index].scale).toBeGreaterThanOrEqual(byDistance[index - 1].scale);
      }
    }
  });
});
EOF

overlay="$project_root/src/lib/goblin-overlay.ts"
installer="$project_root/scripts/install-goblin-overlays.sh"

for file in "$overlay" "$installer"; do
  if ! grep -q "from './goblin-placements'" "$file"; then
    perl -0pi -e "s#import \{ getBackgroundTheme, getGoblinOverlay, type BackgroundTheme \} from './goblins';#import { getBackgroundTheme, getGoblinOverlay, type BackgroundTheme } from './goblins';\nimport { getGoblinPlacement } from './goblin-placements';#g" "$file"
  fi
  if ! grep -q 'const placement = getGoblinPlacement(dateKey);' "$file"; then
    perl -0pi -e 's/(const goblin = getGoblinOverlay\(dateKey\);)/$1\n  const placement = getGoblinPlacement(dateKey);/g' "$file"
  fi
  perl -0pi -e 's/const drawHeight = height \* goblin\.position\.scale \* goblinSceneScale(?: \* placement\.scale)?;/const drawHeight = height * goblin.position.scale * goblinSceneScale * placement.scale;/g; s/const centerX = width \* (?:goblin\.position|placement)\.x;/const centerX = width * placement.x;/g; s/const bottomY = height \* (?:goblin\.position|placement)\.y;/const bottomY = height * placement.y;/g; s/context\.scale\((?:goblin\.position\.flip|placement\.x > 0\.5) \? -1 : 1, 1\);/context.scale(placement.x > 0.5 ? -1 : 1, 1);/g' "$file"
done

echo '已安裝四季景深錨點與日期穩定選位規則。'
