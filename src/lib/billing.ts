import 'server-only';
import { createBilling, type Subject } from '@mpingosystems/billing/core';
import { createBillingRoutes } from '@mpingosystems/billing/next';
import billingConfig from '../../billing.config';
import { createSupabaseServer } from '@/lib/supabase/server';

/** Feature granted by MathAthlone Pro (Stripe lookup key `mathathlone.unlimited_classrooms`). */
export const PRO_FEATURE = 'unlimited_classrooms';
/** Active classrooms a teacher may own without Pro. */
export const FREE_CLASSROOM_LIMIT = 3;

/**
 * Rollout switch, read on the server only at call time. Only the exact value "on" enables billing;
 * anything else (including unset) means off: no class limit, no billing UI, /api/billing/* returns 404,
 * and no Stripe client is ever constructed.
 */
export function billingEnabled(): boolean {
  return process.env.BILLING_MODE === 'on';
}

/** Stripe and Supabase clients are created lazily on first use, so importing this never reads secrets. */
export const billing = createBilling(billingConfig);

/** The billing subject is always the server-validated Supabase user, never a client-supplied ID. */
export async function currentBillingSubject(): Promise<{ subject: Subject; email: string | null } | null> {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { subject: { type: 'user', id: user.id }, email: user.email ?? null };
}

export const billingRoutes = createBillingRoutes(billing, {
  getSubject: () => currentBillingSubject(),
  defaultPlan: 'pro',
});
