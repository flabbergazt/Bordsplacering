# NOTES

- State: crowdfunding bar under the title (funding + funding_items tables, read only; Max edits in Supabase). Simplified model live in code: no security question, names hidden from the API (counts via group_counts view), cap 10 per group with "Fullt", join and leave by name, rename removed. Carousel loops. SASSE theme. Verified with mocked data; Max has not run the new schema yet.
- Next: Max runs supabase/schema.sql again (drops question/answers, adds the view, new functions and the funding tables), deletes test data, adds funding items, tests on two phones. Then: live updates without reload.
- Setup: Supabase project with schema.sql; Vercel with SUPABASE_URL and SUPABASE_ANON_KEY as Secret; deploys on push to main.
- Known: no live updates (reload or return to the tab). The intro still says "kolla var dina kompisar sitter" although names are hidden; Max to decide the wording.
