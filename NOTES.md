# NOTES

- State: iteration 1 live at bordsplacering-delta.vercel.app and verified by Max on phones (start a table, join with right answer, wrong answer refused).
- Next: iteration 2: leave a table (remove your own name), warn when the same name sits at several tables. Waiting for Max's "kör".
- Setup done: Supabase project with schema.sql run; Vercel with SUPABASE_URL and SUPABASE_ANON_KEY as Secret; deploys on push to main.
- Room: the oval Museum hall at Handelshögskolan, drawn to scale from the 1925 plan in src/lib/room.ts. Stage at top, bar lower right, four pillars, entrance at bottom. 14 tables of 8 (112 seats) for 100-110 guests; table positions are a guess until the real plan is known.
- Known: no live updates (reload or return to the tab to refresh). No way to remove a name yet.
