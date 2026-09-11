# NOTES

- State: iteration 2 built: groups as a coverflow carousel (Swiper), suggested placeholder names on free cards, rename a group and remove a member with the answer. Carousel spans the full viewport so side cards show on desktop. Verified with mocked data; not yet on Max's phones.
- Next: Max runs supabase/schema.sql again (adds rename_table and leave_table), tests on two phones. Then iteration 3: warn when the same name is in several groups, live updates.
- Setup: Supabase project with schema.sql; Vercel with SUPABASE_URL and SUPABASE_ANON_KEY as Secret; deploys on push to main.
- Known: no live updates (reload or return to the tab). Cap of 30 per group, effectively none.
