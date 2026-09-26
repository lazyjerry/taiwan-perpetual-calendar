import { describe, expect, it } from 'vitest';
import { getDailyContent } from '../src/lib/content';
import quotes from '../data/quotes.json';

describe('每日內容', () => {
  it('相同日期始終取得相同內容', () => {
    expect(getDailyContent('2026-09-25')).toEqual(getDailyContent('2026-09-25'));
  });

  it.each(Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const paddedMonth = String(month).padStart(2, '0');
    return [`2026-${paddedMonth}-15`, month, `/images/daily/months/${paddedMonth}.webp`] as const;
  }))('%s 使用 %i 月上半月影像', (date, month, file) => {
    const image = getDailyContent(date).image;
    expect(image.month).toBe(month);
    expect(image.file).toBe(file);
  });

  it.each(Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const paddedMonth = String(month).padStart(2, '0');
    return [`2026-${paddedMonth}-16`, month, `/images/daily/months/${paddedMonth}-late.webp`] as const;
  }))('%s 使用 %i 月下半月影像', (date, month, file) => {
    const image = getDailyContent(date).image;
    expect(image.month).toBe(month);
    expect(image.file).toBe(file);
  });
});

describe('每日語錄語料', () => {
  const normalize = (s: string) => s.replace(/[　-〿＀-￯—…]/gu, '').replace(/臺/gu, '台');

  it('id 從 1 起連號且不重複', () => {
    expect(quotes.map((q) => q.id)).toEqual(quotes.map((_, i) => i + 1));
  });

  it('文字去掉標點與台／臺差異後不重複', () => {
    const texts = quotes.map((q) => normalize(q.text));
    expect(new Set(texts).size).toBe(texts.length);
  });
});
