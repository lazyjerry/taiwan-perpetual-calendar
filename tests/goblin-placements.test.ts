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
