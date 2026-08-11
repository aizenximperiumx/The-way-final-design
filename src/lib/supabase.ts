import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { appFetch } from './net';

let cached: SupabaseClient | null = null;

export function tryGetSupabase(): SupabaseClient | null {
  try {
    return getSupabase();
  } catch {
    return null;
  }
}

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  const env = import.meta.env as { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string };
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('VITE_SUPABASE_URL must be your Supabase Project URL (it looks like you pasted a key). It should look like: https://xxxxx.supabase.co');
  }
  if (/^https?:\/\//i.test(anonKey)) {
    throw new Error('VITE_SUPABASE_ANON_KEY must be the anon/publishable key (it looks like you pasted a URL).');
  }
  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    // Sign-in is a cross-origin POST carrying an apikey header, so inside the
    // packaged app it needs permission from the browser before it is sent -
    // the same permission step that hung every call to our own server. Going
    // through the native layer skips it. Untouched on the website.
    global: { fetch: appFetch },
  });
  return cached;
}
