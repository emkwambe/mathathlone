import { defineBilling } from '@mpingosystems/billing/core';

/**
 * MathAthlone billing (Mpingo Billing Core). Prices are referenced by lookup key, so this file is
 * the same in Stripe test and live mode. The Billing Portal configuration is resolved by the kit
 * from Stripe metadata (app = mathathlone); no configuration ID belongs here.
 */
export default defineBilling({
  app: 'mathathlone',
  plans: {
    pro: { price: 'mathathlone_pro_annual', mode: 'subscription' },
  },
  urls: {
    success: '/dashboard/teacher/billing/success',
    cancel: '/#pricing',
    portalReturn: '/dashboard/teacher/classes',
  },
  // Reuse MathAthlone's existing server variables instead of duplicating the secret.
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
});
