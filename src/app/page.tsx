import { connection } from "next/server";
import App from "./app";

/*
 * Server side: read where the database is and hand it to the app.
 *
 * Both spellings are accepted so either works in Vercel. The plain names
 * are preferred: they can be stored as Secret, which Vercel refuses for
 * anything starting with NEXT_PUBLIC_.
 */
export default async function Page() {
  /* Read at request time, not at build time, so a redeploy is enough
     after the variables change. */
  await connection();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
  return <App url={url} anonKey={anonKey} />;
}
