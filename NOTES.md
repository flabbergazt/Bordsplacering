# NOTES

- State: iteration 1 built and pushed (room drawing, start a table with question+answer, sit down with right answer, list of all tables). Supabase project and Vercel project created by Max; first production deploy in progress.
- Next: Max tests on two phones. Then iteration 2: leave a table, warn on same name at several tables.
- Room: src/lib/room.ts is a placeholder rectangle with 12 tables in a grid; redraw once Max sends the real room.
- Known: no live updates (reload or return to the tab to refresh). No way to remove a name yet.
- Variables are SUPABASE_URL and SUPABASE_ANON_KEY (no public prefix), read on the server in page.tsx. Vercel refused to save NEXT_PUBLIC_ names as Secret.
