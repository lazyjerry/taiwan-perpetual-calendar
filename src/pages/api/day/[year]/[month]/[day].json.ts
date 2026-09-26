import type { APIRoute } from 'astro';
import { buildDayPayload } from '../../../../../lib/api';
import { getStaticDateKeys } from '../../../../../lib/calendar';

export function getStaticPaths() {
  return getStaticDateKeys().map((date) => {
    const [year, month, day] = date.split('-');
    return { params: { year, month, day }, props: { date } };
  });
}

export const GET: APIRoute<{ date: string }> = ({ props }) =>
  new Response(JSON.stringify(buildDayPayload(props.date)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
