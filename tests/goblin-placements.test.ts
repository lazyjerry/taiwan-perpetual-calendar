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
