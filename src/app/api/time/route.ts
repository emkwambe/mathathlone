import { NextResponse } from 'next/server';

/**
 * GET /api/time
 * 
 * Returns current server timestamp for clock synchronization.
 * Used by clients to calculate offset between local and server time.
 */
export async function GET() {
  return NextResponse.json({
    timestamp: Date.now(),
    iso: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
