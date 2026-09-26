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
