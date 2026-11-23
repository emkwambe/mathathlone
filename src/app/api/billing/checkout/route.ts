import { billingEnabled, billingRoutes } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/** Starts a hosted Stripe Checkout for the signed-in user. 401 when signed out; 404 when BILLING_MODE is off. */
export async function POST(request: Request) {
  if (!billingEnabled()) return Response.json({ error: 'Not found.' }, { status: 404 });
  return billingRoutes.checkout(request);
}
