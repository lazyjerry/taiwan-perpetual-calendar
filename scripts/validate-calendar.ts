import { getCalendarDay } from '../src/lib/calendar';

const references = [
  { date: '2026-01-01', lunar: '十一月十三', source: 'HKO 2026' },
  { date: '2026-02-17', lunar: '正月初一', source: 'HKO 2026' },
  { date: '2026-09-23', lunar: '八月十三', solarTerm: '秋分', source: 'HKO 2026' },
  { date: '2026-09-25', lunar: '八月十五', source: 'HKO 2026' },
  { date: '2026-12-22', lunar: '十一月十四', solarTerm: '冬至', source: 'HKO 2026' }
] as const;

const failures: string[] = [];
for (const reference of references) {
  const actual = getCalendarDay(reference.date);
  if (actual.lunar.display !== reference.lunar) {
    failures.push(`${reference.date} 農曆：預期 ${reference.lunar}，實際 ${actual.lunar.display}`);
  }
  if ('solarTerm' in reference && actual.solarTerm !== reference.solarTerm) {
    failures.push(`${reference.date} 節氣：預期 ${reference.solarTerm}，實際 ${actual.solarTerm}`);
  }
}

for (let year = 1901; year <= 2100; year += 1) {
  for (const suffix of ['01-01', '06-30', '12-31']) {
    const day = getCalendarDay(`${year}-${suffix}`);
    if (!day.lunar.display || !day.ganzhi.day || !day.zodiac) {
      failures.push(`${day.date} 缺少必要曆法欄位`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`曆法驗證通過：${references.length} 筆香港天文台 2026 對照資料，並抽樣 1901–2100 年共 600 個邊界日期。`);
