import type { APIRoute } from 'astro';
import { buildMonthPayload } from '../../../../lib/api';
import { STATIC_END_YEAR, STATIC_START_YEAR } from '../../../../lib/calendar';

export function getStaticPaths() {
  const paths = [];
  for (let year = STATIC_START_YEAR; year <= STATIC_END_YEAR; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      paths.push({ params: { year: String(year), month: String(month).padStart(2, '0') }, props: { year, month } });
    }
  }
  return paths;
}

export const GET: APIRoute<{ year: number; month: number }> = ({ props }) =>
  new Response(JSON.stringify(buildMonthPayload(props.year, props.month)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
