import { describe, expect, it } from 'vitest';
import { buildApiIndex, buildDayPayload, buildMonthPayload, dayApiHref, monthApiHref } from '../src/lib/api';

describe('JSON API 資料', () => {
  it('日資料包含曆法、語錄、影像與連結', () => {
    const payload = buildDayPayload('2026-09-25');
    expect(payload.lunar.display).toBe('八月十五');
    expect(payload.quote.text).toBeTruthy();
    expect(payload.image.file).toBe('/images/daily/months/09.webp');
    expect(payload.links).toEqual({
      page: '/day/2026/09/25/',
      api: '/api/day/2026/09/25.json',
      month: '/api/month/2026/09.json',
      previous: '/api/day/2026/09/24.json',
      next: '/api/day/2026/09/26.json'
    });
  });

  it('靜態範圍邊界的前後連結為 null', () => {
    expect(buildDayPayload('2020-01-01').links.previous).toBeNull();
    expect(buildDayPayload('2040-12-31').links.next).toBeNull();
    expect(buildMonthPayload(2020, 1).links.previous).toBeNull();
    expect(buildMonthPayload(2040, 12).links.next).toBeNull();
  });

  it('月資料涵蓋整月並跨年連結', () => {
    const payload = buildMonthPayload(2024, 12);
    expect(payload.days).toHaveLength(31);
    expect(payload.days[0].date).toBe('2024-12-01');
    expect(payload.links.next).toBe('/api/month/2025/01.json');
    expect(payload.links.previous).toBe('/api/month/2024/11.json');
  });

  it('產生零填補的 API 路徑', () => {
    expect(dayApiHref('2026-01-05')).toBe('/api/day/2026/01/05.json');
    expect(monthApiHref(2026, 1)).toBe('/api/month/2026/01.json');
  });

  it('索引列出支援範圍', () => {
    expect(buildApiIndex().range).toEqual({ start: '2020-01-01', end: '2040-12-31' });
  });
});
