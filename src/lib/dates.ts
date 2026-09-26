export const ENGINE_START_YEAR = 1901;
export const ENGINE_END_YEAR = 2100;
export const STATIC_START_YEAR = 2020;
export const STATIC_END_YEAR = 2040;

const pad = (value: number) => String(value).padStart(2, '0');

export function makeDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new RangeError(`日期格式錯誤：${dateKey}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new RangeError(`日期不存在：${dateKey}`);
  }
  return { year, month, day };
}

export function isEngineDate(dateKey: string): boolean {
  try {
    const { year } = parseDateKey(dateKey);
    return year >= ENGINE_START_YEAR && year <= ENGINE_END_YEAR;
  } catch {
    return false;
  }
}

export function isStaticDate(dateKey: string): boolean {
  if (!isEngineDate(dateKey)) return false;
  const { year } = parseDateKey(dateKey);
  return year >= STATIC_START_YEAR && year <= STATIC_END_YEAR;
}

export function addDays(dateKey: string, amount: number): string {
  const { year, month, day } = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return makeDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function getTaipeiDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getTaipeiDateTime(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone: 'Asia/Taipei'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
}

export function dayHref(dateKey: string): string {
  if (!isStaticDate(dateKey)) return `/lookup/?date=${dateKey}`;
  const { year, month, day } = parseDateKey(dateKey);
  return `/day/${year}/${pad(month)}/${pad(day)}/`;
}

export function monthHref(year: number, month: number): string {
  if (year < STATIC_START_YEAR || year > STATIC_END_YEAR) {
    return `/lookup/?date=${makeDateKey(year, month, 1)}`;
  }
  return `/calendar/${year}/${pad(month)}/`;
}
