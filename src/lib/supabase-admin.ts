import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client. Uses the secret key (service_role equivalent),
// which bypasses Row Level Security. NEVER import this from a client component
// or any file that runs in the browser.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. ' +
      'Check your .env.local and Vercel Environment Variables.',
  );
}

export const supabaseAdmin = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
