# NOTES

- State: iteration 1 live at bordsplacering-delta.vercel.app and verified by Max on phones (start a table, join with right answer, wrong answer refused).
- Next: iteration 2: leave a table (remove your own name), warn when the same name sits at several tables. Redraw the room in src/lib/room.ts when Max sends a sketch.
- Setup done: Supabase project with schema.sql run; Vercel with SUPABASE_URL and SUPABASE_ANON_KEY as Secret; deploys on push to main.
- Known: no live updates (reload or return to the tab to refresh). No way to remove a name yet. Room is a placeholder rectangle with 12 tables.
