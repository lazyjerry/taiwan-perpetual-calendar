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
