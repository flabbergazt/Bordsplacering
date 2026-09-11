-- Bordsplacering: tables, guests and the one secret per table (the answer).
--
-- Run this once in the Supabase SQL editor for a fresh project.
--
-- There is no login. Everyone reads tables and guests through the anon key.
-- Nothing is written directly: all writes go through the two functions at
-- the bottom, which run with the database owner's rights (security definer)
-- so they can read the answer that the browser never gets to see.

create extension if not exists pgcrypto;

create table if not exists public.tables (
  id         uuid primary key default gen_random_uuid(),
  slot       integer not null unique,          -- which drawn table in src/lib/room.ts
  name       text not null,
  question   text not null,                    -- shown to everyone
  capacity   integer not null default 8,
  created_at timestamptz not null default now()
);

-- The answer lives in its own table with row-level security on and no
-- policies, so the API cannot read it at all. Only the functions below can.
create table if not exists public.table_answers (
  table_id uuid primary key references public.tables (id) on delete cascade,
  answer   text not null                       -- normalized: lower case, trimmed
);

create table if not exists public.guests (
  id         uuid primary key default gen_random_uuid(),
  table_id   uuid not null references public.tables (id) on delete cascade,
  name       text not null,
  name_key   text not null,                    -- normalized name, for the duplicate rule
  created_at timestamptz not null default now(),
  unique (table_id, name_key)                  -- same name twice on one table is refused
);

alter table public.tables        enable row level security;
alter table public.table_answers enable row level security;
alter table public.guests        enable row level security;

drop policy if exists "anyone can read tables" on public.tables;
create policy "anyone can read tables"
  on public.tables for select to anon, authenticated using (true);

drop policy if exists "anyone can read guests" on public.guests;
create policy "anyone can read guests"
  on public.guests for select to anon, authenticated using (true);

-- Belt and braces: even without RLS the API roles may not touch the answers.
revoke all on public.table_answers from anon, authenticated;

-- "Stockholm " and "stockholm" are the same answer, and the same name.
create or replace function public.normalize_text(input text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(btrim(coalesce(input, '')), '\s+', ' ', 'g'));
$$;

-- Start a table on a free spot in the room. The creator is seated at once.
-- Errors come back as plain codes that the app translates.
create or replace function public.create_table(
  p_slot     integer,
  p_name     text,
  p_creator  text,
  p_question text,
  p_answer   text,
  p_capacity integer default 8
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if length(normalize_text(p_name)) = 0     then raise exception 'table_name_required'; end if;
  if length(normalize_text(p_creator)) = 0  then raise exception 'name_required'; end if;
  if length(normalize_text(p_question)) = 0 then raise exception 'question_required'; end if;
  if length(normalize_text(p_answer)) = 0   then raise exception 'answer_required'; end if;
  if p_capacity < 1 or p_capacity > 30      then raise exception 'bad_capacity'; end if;

  insert into tables (slot, name, question, capacity)
    values (p_slot, btrim(p_name), btrim(p_question), p_capacity)
    returning id into v_id;

  insert into table_answers (table_id, answer)
    values (v_id, normalize_text(p_answer));

  insert into guests (table_id, name, name_key)
    values (v_id, btrim(p_creator), normalize_text(p_creator));

  return v_id;
exception
  when unique_violation then
    raise exception 'slot_taken';
end;
$$;

-- Sit down at a table. Right answer required; table must have room; the
-- same name cannot be seated twice at the same table.
create or replace function public.join_table(
  p_table_id uuid,
  p_name     text,
  p_answer   text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer   text;
  v_capacity integer;
  v_count    integer;
  v_id       uuid;
begin
  if length(normalize_text(p_name)) = 0 then raise exception 'name_required'; end if;

  select a.answer, t.capacity
    into v_answer, v_capacity
    from tables t
    join table_answers a on a.table_id = t.id
   where t.id = p_table_id;

  if not found then raise exception 'table_not_found'; end if;
  if v_answer <> normalize_text(p_answer) then raise exception 'wrong_answer'; end if;

  select count(*) into v_count from guests where table_id = p_table_id;
  if v_count >= v_capacity then raise exception 'table_full'; end if;

  insert into guests (table_id, name, name_key)
    values (p_table_id, btrim(p_name), normalize_text(p_name))
    returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'already_seated';
end;
$$;

grant execute on function public.normalize_text(text) to anon, authenticated;
grant execute on function public.create_table(integer, text, text, text, text, integer) to anon, authenticated;
grant execute on function public.join_table(uuid, text, text) to anon, authenticated;
