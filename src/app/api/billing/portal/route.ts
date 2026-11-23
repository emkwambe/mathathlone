import { billingEnabled, billingRoutes } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/** Opens the Stripe Billing Portal for the signed-in user. 401 signed out, 404 with no billing record or when BILLING_MODE is off. */
export async function POST(request: Request) {
  if (!billingEnabled()) return Response.json({ error: 'Not found.' }, { status: 404 });
  return billingRoutes.portal(request);
}
