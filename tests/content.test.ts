import { describe, expect, it } from 'vitest';
import { getDailyContent } from '../src/lib/content';

describe('每日內容', () => {
  it('相同日期始終取得相同內容', () => {
    expect(getDailyContent('2026-09-25')).toEqual(getDailyContent('2026-09-25'));
  });

  it.each([
    ['2026-01-01', 1, '/images/daily/months/01.webp'],
    ['2026-02-01', 2, '/images/daily/months/02.webp'],
    ['2026-03-01', 3, '/images/daily/months/03.webp'],
    ['2026-04-01', 4, '/images/daily/months/04.webp'],
    ['2026-05-01', 5, '/images/daily/months/05.webp'],
    ['2026-06-01', 6, '/images/daily/months/06.webp'],
    ['2026-07-01', 7, '/images/daily/months/07.webp'],
    ['2026-08-01', 8, '/images/daily/months/08.webp'],
    ['2026-09-01', 9, '/images/daily/months/09.webp'],
    ['2026-10-01', 10, '/images/daily/months/10.webp'],
    ['2026-11-01', 11, '/images/daily/months/11.webp'],
    ['2026-12-01', 12, '/images/daily/months/12.webp']
  ])('%s 使用 %i 月影像', (date, month, file) => {
    const image = getDailyContent(date).image;
    expect(image.month).toBe(month);
    expect(image.file).toBe(file);
  });
});
