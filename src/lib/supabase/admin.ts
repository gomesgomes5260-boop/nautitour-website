import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Server-only Supabase client using the service_role key.
 *
 * Use ONLY in trusted server contexts (route handlers, server actions
 * called from trusted code paths) — never in client components and
 * never in middleware that runs on user-controlled requests without
 * verifying the request origin first (e.g. webhook signature check).
 *
 * service_role bypasses RLS, so any logic that calls this must validate
 * inputs and authorization itself.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
