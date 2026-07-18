// =============================================================================
// index.ts — Cloudflare Worker entry point for MathAthlone HeatRoom
// =============================================================================
// This Worker acts as the gateway to HeatRoom Durable Object instances.
// Each heat maps to exactly one Durable Object, named by heatId.
//
// Routes:
//   GET  /ws/{heatId}?userId=...&displayName=...&countryCode=...
//        → WebSocket upgrade, routed to the HeatRoom for that heat
//
//   POST /heat/{heatId}/init
//        → Pre-load heat data into the Durable Object (called by Next.js)
//        → Requires X-Heat-Secret header matching HEAT_ROOM_SECRET env var
//
//   GET  /heat/{heatId}/status
//        → Returns current phase and participant count
//        → Public (no auth required)
// =============================================================================

import { Env } from './types';
export { HeatRoom } from './HeatRoom';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // ── WebSocket: GET /ws/{heatId} ───────────────────────────────────────────
    const wsMatch = pathname.match(/^\/ws\/([a-zA-Z0-9_-]+)$/);
    if (wsMatch && request.headers.get('Upgrade') === 'websocket') {
      const heatId = wsMatch[1];
      const stub = getHeatRoom(env, heatId);
      return stub.fetch(new Request(`${url.origin}/ws?${url.searchParams}`, {
        method: 'GET',
        headers: request.headers,
      }));
    }

    // ── Init: POST /heat/{heatId}/init ────────────────────────────────────────
    const initMatch = pathname.match(/^\/heat\/([a-zA-Z0-9_-]+)\/init$/);
    if (initMatch && request.method === 'POST') {
      const secret = request.headers.get('X-Heat-Secret');
      if (secret !== env.HEAT_ROOM_SECRET) {
        return corsResponse(new Response('Unauthorized', { status: 401 }));
      }
      const heatId = initMatch[1];
      const stub = getHeatRoom(env, heatId);
      const body = await request.text();
      return corsResponse(await stub.fetch(new Request(`${url.origin}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })));
    }

    // ── Status: GET /heat/{heatId}/status ─────────────────────────────────────
    const statusMatch = pathname.match(/^\/heat\/([a-zA-Z0-9_-]+)\/status$/);
    if (statusMatch && request.method === 'GET') {
      const heatId = statusMatch[1];
      const stub = getHeatRoom(env, heatId);
      return corsResponse(await stub.fetch(new Request(`${url.origin}/status`, { method: 'GET' })));
    }

    return corsResponse(new Response('Not found', { status: 404 }));
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHeatRoom(env: Env, heatId: string): DurableObjectStub {
  const id = env.HEAT_ROOM.idFromName(heatId);
  return env.HEAT_ROOM.get(id);
}

function corsResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Heat-Secret, Upgrade');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
