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
- `src/app/page.tsx` is the whole UI.

## Running it

```bash
npm run dev
```

Needs `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). Without them the app
shows "Ingen databas konfigurerad" and nothing else can be exercised.

```bash
npm run build
```

Compiles and typechecks. There are no tests.

## Done means

`npm run build` is clean, **and** either you exercised the change yourself or
you told Max exactly what to tap to see it.

## Sensitive

- Never commit `.env*`, keys or tokens.
- `NEXT_PUBLIC_*` are baked in at **build** time. Changing them in Vercel does
  nothing until a redeploy.
- Deploys happen through the Vercel GitHub App on push to `main`. Ask before
  pushing.
