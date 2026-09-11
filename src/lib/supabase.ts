/*
 * The Supabase client.
 *
 * The anon key ships in the browser on purpose: it identifies the project,
 * it does not grant access. What the database lets it do is decided in
 * supabase/schema.sql: read tables and guests, call the two functions.
 * Nothing else.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the app has been given somewhere to talk to. */
export const isConfigured = Boolean(url && anonKey);

/**
 * Which variables are missing, by name. They are inlined at BUILD time, so
 * adding them in Vercel does nothing until the next deploy.
 */
export const missingEnv: string[] = [
  ...(url ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
  ...(anonKey ? [] : ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
];

/* Null rather than throwing, so a build without the variables still succeeds
   and the app can say what is wrong instead of showing a blank screen. */
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anonKey!, {
      /* No login in this app, so nothing to persist. */
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
