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
