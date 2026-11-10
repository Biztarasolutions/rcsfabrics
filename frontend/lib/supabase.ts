// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase public (anon) client for the frontend, used for admin image uploads.
// Created lazily so a missing env var never breaks the build or the storefront —
// only the upload itself reports the problem.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('example.supabase.co')) {
      throw new Error('Image uploads are not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Netlify.');
    }
    client = createClient(url, key);
  }
  return client;
}
