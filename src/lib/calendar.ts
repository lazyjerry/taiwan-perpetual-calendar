import lunarCalendar from 'lunar-javascript';
import * as OpenCC from 'opencc-js';
import { addDays, ENGINE_END_YEAR, ENGINE_START_YEAR, makeDateKey, parseDateKey, STATIC_END_YEAR, STATIC_START_YEAR } from './dates';

export { addDays, dayHref, ENGINE_END_YEAR, ENGINE_START_YEAR, getTaipeiDateKey, isEngineDate, isStaticDate, makeDateKey, monthHref, parseDateKey, STATIC_END_YEAR, STATIC_START_YEAR } from './dates';

export interface CalendarDay {
  date: string;
  year: number;
  month: number;
  day: number;
  weekday: string;
  lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
    yearText: string;
    monthText: string;
    dayText: string;
    display: string;
  };
  ganzhi: {
    year: string;
    month: string;
    day: string;
  };
  zodiac: string;
  solarTerm: string | null;
  almanac: {
    yi: string[];
    ji: string[];
  };
}

const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
const weekdays = new Intl.DateTimeFormat('zh-TW', {
  weekday: 'long',
  timeZone: 'Asia/Taipei'
});
const lunarMonthNames = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

export function getCalendarDay(dateKey: string): CalendarDay {
  const { year, month, day } = parseDateKey(dateKey);
  if (year < ENGINE_START_YEAR || year > ENGINE_END_YEAR) {
    throw new RangeError(`只支援 ${ENGINE_START_YEAR}–${ENGINE_END_YEAR} 年。`);
  }

  const lunar = lunarCalendar.Solar.fromYmd(year, month, day).getLunar();
  const lunarMonth = lunar.getMonth();
  const isLeapMonth = lunarMonth < 0;
  const monthText = lunarMonthNames[Math.abs(lunarMonth)];
  const dayText = toTraditional(lunar.getDayInChinese());
  const display = `${isLeapMonth ? '閏' : ''}${monthText}月${dayText}`;
  const dateAtNoon = new Date(Date.UTC(year, month - 1, day, 12));
  const clean = (items: string[]) => items.map(toTraditional).filter((item) => item && item !== '無');
  const solarTerm = toTraditional(lunar.getJieQi());

  return {
    date: dateKey,
    year,
    month,
    day,
    weekday: weekdays.format(dateAtNoon),
    lunar: {
      year: lunar.getYear(),
      month: Math.abs(lunarMonth),
      day: lunar.getDay(),
      isLeapMonth,
      yearText: toTraditional(lunar.getYearInChinese()),
      monthText,
      dayText,
      display
    },
    ganzhi: {
      year: toTraditional(lunar.getYearInGanZhi()),
      month: toTraditional(lunar.getMonthInGanZhi()),
      day: toTraditional(lunar.getDayInGanZhi())
    },
    zodiac: toTraditional(lunar.getYearShengXiao()),
    solarTerm: solarTerm || null,
    almanac: {
      yi: clean(lunar.getDayYi()),
      ji: clean(lunar.getDayJi())
    }
  };
}

export function getStaticDateKeys(): string[] {
  const keys: string[] = [];
  let cursor = makeDateKey(STATIC_START_YEAR, 1, 1);
  const end = makeDateKey(STATIC_END_YEAR, 12, 31);
  while (cursor <= end) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return keys;
}

export function getMonthDays(year: number, month: number): CalendarDay[] {
  if (year < ENGINE_START_YEAR || year > ENGINE_END_YEAR || month < 1 || month > 12) {
    throw new RangeError('年月超出支援範圍。');
  }
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: total }, (_, index) => getCalendarDay(makeDateKey(year, month, index + 1)));
}
