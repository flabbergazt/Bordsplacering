/*
 * The Supabase client.
 *
 * The anon key ends up in the browser on purpose: it identifies the project,
 * it does not grant access. What the database lets it do is decided in
 * supabase/schema.sql: read tables and guests, call the two functions.
 * Nothing else.
 *
 * The address and key are read from the environment on the server in
 * src/app/page.tsx and passed in here, so the variables can be stored as
 * ordinary secrets in Vercel without a public prefix.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function makeClient(url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    /* No login in this app, so nothing to persist. */
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
