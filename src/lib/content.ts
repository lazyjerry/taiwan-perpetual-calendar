import quotes from '../../data/quotes.json';
import images from '../../data/images.json';
import { parseDateKey } from './dates';

export interface DailyContent {
  quote: (typeof quotes)[number];
  image: (typeof images)[number];
}

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function getDailyContent(dateKey: string): DailyContent {
  const { month } = parseDateKey(dateKey);
  const image = images.find((candidate) => candidate.month === month);
  if (!image) {
    throw new RangeError(`找不到 ${month} 月的每日影像。`);
  }
  return {
    quote: quotes[stableIndex(`quote:${dateKey}`, quotes.length)],
    image
  };
}
