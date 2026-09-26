import type { APIRoute } from 'astro';
import { getStaticDateKeys } from '../lib/calendar';
import { monthHref, STATIC_END_YEAR, STATIC_START_YEAR } from '../lib/dates';

export const prerender = true;

const siteUrl = 'https://taiwan-perpetual-calendar.pages.dev';

export const GET: APIRoute = () => {
  const months = Array.from(
    { length: (STATIC_END_YEAR - STATIC_START_YEAR + 1) * 12 },
    (_, index) => monthHref(STATIC_START_YEAR + Math.floor(index / 12), (index % 12) + 1)
  );
  const paths = new Set([
    '/',
    '/lookup/',
    ...months,
    ...getStaticDateKeys().map((date) => {
      const [year, month, day] = date.split('-');
      return `/day/${year}/${month}/${day}/`;
    })
  ]);
  const urls = [...paths]
    .map((path) => `<url><loc>${siteUrl}${path}</loc></url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};