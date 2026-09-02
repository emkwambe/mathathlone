import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Server-only client for narrowly scoped administrator operations, such as
 * teacher-approved managed Mathlete provisioning. Never import from a client
 * component and never expose the Supabase secret key to the browser.
 *
 * SUPABASE_SECRET_KEY is the current Supabase server-side key name. The legacy
 * SUPABASE_SERVICE_ROLE_KEY is accepted only as a transition fallback.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error('Missing server administration configuration. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to server environment variables.');
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
