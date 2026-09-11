# NOTES

- State: iteration 1 built and pushed (room drawing, start a table with question+answer, sit down with right answer, list of all tables). Supabase project and Vercel project created by Max; first production deploy in progress.
- Next: Max tests on two phones. Then iteration 2: leave a table, warn on same name at several tables.
- Room: src/lib/room.ts is a placeholder rectangle with 12 tables in a grid; redraw once Max sends the real room.
- Known: no live updates (reload or return to the tab to refresh). No way to remove a name yet.
- Vercel warns about NEXT_PUBLIC_ variables being public. That is intended; keep the names.
