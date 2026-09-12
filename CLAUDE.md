@AGENTS.md

# Bordsplacering

A one-page web app for a party: guests open a link on their phone, browse
groups as cards in a carousel, join one or start their own. No login. A
group is protected by a question its creator wrote; the right answer is
the only key. Next.js + Supabase, deployed on Vercel.

Owner: Max, a product manager, not a developer. Reply in Swedish; keep code,
file names and commands in English. Agree the scope before writing code.

**Read `NOTES.md` first.** Five lines: where the project stands, what is next,
what is knowingly broken.

## How it hangs together

- A group is a numbered slot. `src/lib/groups.ts` decides which cards to
  show: every group that exists, then the suggested names nobody has taken
  (the `SUGGESTIONS` list, by number), then two blank cards. A suggestion
  is a placeholder; the card is not active until someone starts it.
- `supabase/schema.sql` is the data model and the only way to write. In the
  database a group is still called a `table` and a member a `guest`; the
  names stuck from the first version. The answer to a group's question is
  stored in `table_answers`, which the API cannot read. Joining and
  renaming go through `join_table()` and `rename_table()`, which compare
  answers on the server. Never put the answer in a column the browser can
  select.
- `src/lib/db.ts` is every read and write the page makes, and the Swedish
  translation of the error codes the database raises.
- `src/app/page.tsx` runs on the server, reads `SUPABASE_URL` and
  `SUPABASE_ANON_KEY` at request time and hands them to `src/app/app.tsx`,
  which is the whole UI. Plain names on purpose: Vercel refuses to store a
  `NEXT_PUBLIC_` variable as Secret.
- The look is borrowed from sasse.se: deep purple, white box behind the
  title, Outfit (a free stand-in for their Century Gothic-like face), pill
  buttons. Colour tokens live in `src/app/globals.css`, the card palette in
  `src/lib/colors.ts` and has no purple on purpose.
- The carousel is Swiper with the coverflow effect, `depth: 0` on purpose:
  slides pushed back in 3D stop receiving taps in Chrome.

## Running it

```bash
npm run dev
```

Needs `.env.local` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` (see
`.env.example`). Without them the app shows "Ingen databas konfigurerad"
and nothing else can be exercised.

```bash
npm run build
```

Compiles and typechecks. There are no tests.

## Done means

`npm run build` is clean, **and** either you exercised the change yourself or
you told Max exactly what to tap to see it.

## Sensitive

- Never commit `.env*`, keys or tokens.
- Environment variables are read per request, but Vercel still needs a
  redeploy after they change.
- Deploys happen through the Vercel GitHub App on push to `main`. Ask before
  pushing.
