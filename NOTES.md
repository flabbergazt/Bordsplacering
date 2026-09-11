# NOTES

- State: iteration 1 built (room drawing, start a table with question+answer, sit down with right answer, list of all tables). Not run against a real Supabase yet.
- Next: Max creates a Supabase project, runs supabase/schema.sql, deploys to Vercel with the two env vars, tests on two phones. Then iteration 2: leave a table, warn on same name at several tables.
- Room: src/lib/room.ts is a placeholder rectangle with 12 tables in a grid; redraw once Max sends the real room.
- Known: no live updates (reload or return to the tab to refresh). No way to remove a name yet.
