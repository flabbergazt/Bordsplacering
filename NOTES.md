# NOTES

- State: iteration 1 live at bordsplacering-delta.vercel.app and verified by Max on phones (start a table, join with right answer, wrong answer refused).
- Next: iteration 2: leave a table (remove your own name), warn when the same name sits at several tables. Waiting for Max's "kör".
- Setup done: Supabase project with schema.sql run; Vercel with SUPABASE_URL and SUPABASE_ANON_KEY as Secret; deploys on push to main.
- Room: the 1925 plan of the Museum hall is the background (public/room.jpg, 50 px per metre). Stage, bar, entrance and tables are drawn on top from src/lib/room.ts. 12 rectangular tables of 8 (2.0 x 0.8 m, 96 seats) is what fits to scale; Max expects 100-110 guests, so table size or count is still open.
- Known: no live updates (reload or return to the tab to refresh). No way to remove a name yet.
