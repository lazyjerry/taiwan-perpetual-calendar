import { describe, expect, it } from 'vitest';
import { addDays, getCalendarDay, getMonthDays, getTaipeiDateKey } from '../src/lib/calendar';

describe('曆法引擎', () => {
  it.each([
    ['2020-01-25', '正月初一'],
    ['2024-02-10', '正月初一'],
    ['2025-01-29', '正月初一'],
    ['2026-02-17', '正月初一'],
    ['2026-09-25', '八月十五']
  ])('%s 轉換為 %s', (date, lunar) => {
    expect(getCalendarDay(date).lunar.display).toBe(lunar);
  });

  it.each([
    ['2026-03-20', '春分'],
    ['2026-06-21', '夏至'],
    ['2026-09-23', '秋分'],
    ['2026-12-22', '冬至']
  ])('%s 正確識別節氣 %s', (date, term) => {
    expect(getCalendarDay(date).solarTerm).toBe(term);
  });

  it('處理跨年日期運算', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('產生完整的閏年月曆', () => {
    expect(getMonthDays(2024, 2)).toHaveLength(29);
  });

  it('以台灣時區取得日期', () => {
    expect(getTaipeiDateKey(new Date('2026-09-24T16:30:00Z'))).toBe('2026-09-25');
  });
});
