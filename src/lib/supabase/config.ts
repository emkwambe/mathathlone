// =============================================================================
// MathAthlone — Supabase Public Configuration
// =============================================================================
// The current Supabase API-key model uses a publishable key. The legacy anon
// key remains supported only to make a staged Vercel/environment migration safe.
// Both values are designed to be public and may use the NEXT_PUBLIC_ prefix.
// =============================================================================

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Missing Supabase public configuration. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the server environment.'
    );
  }

  return { url, publishableKey };
}
