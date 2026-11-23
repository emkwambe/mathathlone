import { billingEnabled, billingRoutes } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/**
 * Stripe webhook. The kit verifies the signature on the raw text body, records the event once,
 * and applies it. Unsigned or tampered requests get 400. No session is involved; the proxy does
 * not redirect /api/* requests. 404 when BILLING_MODE is off.
 */
export async function POST(request: Request) {
  if (!billingEnabled()) return Response.json({ error: 'Not found.' }, { status: 404 });
  return billingRoutes.webhook(request);
}
