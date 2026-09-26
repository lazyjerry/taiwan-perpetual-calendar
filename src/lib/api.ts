import type { CalendarDay } from './calendar';
import { getCalendarDay, getMonthDays } from './calendar';
import type { DailyContent } from './content';
import { getDailyContent } from './content';
import { addDays, dayHref, isStaticDate, makeDateKey, monthHref, parseDateKey, STATIC_END_YEAR, STATIC_START_YEAR } from './dates';

export const API_VERSION = 1;

export interface DayPayload extends CalendarDay {
  quote: DailyContent['quote'];
  image: DailyContent['image'];
  links: {
    page: string;
    api: string;
    month: string;
    previous: string | null;
    next: string | null;
  };
}

export interface MonthPayload {
  year: number;
  month: number;
  links: {
    page: string;
    api: string;
    previous: string | null;
    next: string | null;
  };
  days: DayPayload[];
}

const pad = (value: number) => String(value).padStart(2, '0');

export function dayApiHref(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  return `/api/day/${year}/${pad(month)}/${pad(day)}.json`;
}

export function monthApiHref(year: number, month: number): string {
  return `/api/month/${year}/${pad(month)}.json`;
}

function staticDayApiHref(dateKey: string): string | null {
  return isStaticDate(dateKey) ? dayApiHref(dateKey) : null;
}

function staticMonthApiHref(year: number, month: number): string | null {
  return year >= STATIC_START_YEAR && year <= STATIC_END_YEAR ? monthApiHref(year, month) : null;
}

export function buildDayPayload(dateKey: string): DayPayload {
  const calendarDay = getCalendarDay(dateKey);
  const content = getDailyContent(dateKey);
  return {
    ...calendarDay,
    quote: content.quote,
    image: content.image,
    links: {
      page: dayHref(dateKey),
      api: dayApiHref(dateKey),
      month: monthApiHref(calendarDay.year, calendarDay.month),
      previous: staticDayApiHref(addDays(dateKey, -1)),
      next: staticDayApiHref(addDays(dateKey, 1))
    }
  };
}

export function buildMonthPayload(year: number, month: number): MonthPayload {
  const previous = new Date(Date.UTC(year, month - 2, 1));
  const next = new Date(Date.UTC(year, month, 1));
  return {
    year,
    month,
    links: {
      page: monthHref(year, month),
      api: monthApiHref(year, month),
      previous: staticMonthApiHref(previous.getUTCFullYear(), previous.getUTCMonth() + 1),
      next: staticMonthApiHref(next.getUTCFullYear(), next.getUTCMonth() + 1)
    },
    days: getMonthDays(year, month).map((day) => buildDayPayload(day.date))
  };
}

export function buildApiIndex() {
  return {
    name: '島日曆 API',
    version: API_VERSION,
    timezone: 'Asia/Taipei',
    range: {
      start: makeDateKey(STATIC_START_YEAR, 1, 1),
      end: makeDateKey(STATIC_END_YEAR, 12, 31)
    },
    endpoints: {
      day: '/api/day/{YYYY}/{MM}/{DD}.json',
      month: '/api/month/{YYYY}/{MM}.json'
    },
    docs: 'https://github.com/lazyjerry/taiwan-perpetual-calendar/blob/main/docs/api.md'
  };
}
