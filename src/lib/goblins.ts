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
