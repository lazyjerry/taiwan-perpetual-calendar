import type { APIRoute } from 'astro';
import { buildApiIndex } from '../../lib/api';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildApiIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
