@AGENTS.md

# Bordsplacering

A one-page web app for a party: guests open a link on their phone, see the
room with its tables, start a table of their own or sit down at one that
exists. No login. A table is protected by a question its creator wrote; the
right answer is the only key. Next.js + Supabase, deployed on Vercel.

Owner: Max, a product manager, not a developer. Reply in Swedish; keep code,
file names and commands in English. Agree the scope before writing code.

**Read `NOTES.md` first.** Five lines: where the project stands, what is next,
what is knowingly broken.

## How it hangs together

- `src/lib/room.ts` is the drawing: walls, stage, bar, entrance, where the
  tables stand, how many fit at each, the colours. Redraw the room here and
  nowhere else. A drawn table is a **slot**; a slot gets a database row the
  moment someone starts a table there.
- `supabase/schema.sql` is the data model and the only way to write. The
  answer to a table's question is stored in `table_answers`, which the API
  cannot read. Joining goes through `join_table()`, which compares answers
  on the server. Never put the answer in a column the browser can select.
- `src/lib/db.ts` is every read and write the page makes, and the Swedish
  translation of the error codes the database raises.
- `src/app/page.tsx` runs on the server, reads `SUPABASE_URL` and
  `SUPABASE_ANON_KEY` at request time and hands them to `src/app/app.tsx`,
  which is the whole UI. Plain names on purpose: Vercel refuses to store a
  `NEXT_PUBLIC_` variable as Secret.

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
