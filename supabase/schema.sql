-- Bordsplacering: groups ("tables" in the database, the name stuck from the
-- first version) and their members ("guests").
--
-- Run this in the Supabase SQL editor. It is safe to run again: it
-- replaces what is there.
--
-- There is no login and no secret. Everyone reads the groups and how many
-- have joined each; nobody can read the names through the API. Writes go
-- through the functions at the bottom, which run with the database owner's
-- rights (security definer).

create extension if not exists pgcrypto;

create table if not exists public.tables (
  id         uuid primary key default gen_random_uuid(),
  slot       integer not null unique,          -- the group's number on screen
  name       text not null,
  capacity   integer not null default 10,
  created_at timestamptz not null default now()
);

create table if not exists public.guests (
  id         uuid primary key default gen_random_uuid(),
  table_id   uuid not null references public.tables (id) on delete cascade,
  name       text not null,
  name_key   text not null,                    -- normalized name, for the duplicate rule
  created_at timestamptz not null default now(),
  unique (table_id, name_key)                  -- same name twice in one group is refused
);

-- Leftovers from the version with a security question.
drop function if exists public.create_table(integer, text, text, text, text, integer);
drop function if exists public.join_table(uuid, text, text);
drop function if exists public.rename_table(uuid, text, text);
drop function if exists public.leave_table(uuid, uuid, text);
drop table if exists public.table_answers;
alter table public.tables drop column if exists question;
alter table public.tables alter column capacity set default 10;

alter table public.tables enable row level security;
alter table public.guests enable row level security;

drop policy if exists "anyone can read tables" on public.tables;
create policy "anyone can read tables"
  on public.tables for select to anon, authenticated using (true);

-- Names stay private: no policy on guests, and no grant either.
drop policy if exists "anyone can read guests" on public.guests;
revoke all on public.guests from anon, authenticated;

-- How many have joined each group. A view runs with the owner's rights, so
-- it can count rows the caller may not read.
create or replace view public.group_counts as
  select table_id, count(*)::integer as members
    from public.guests
   group by table_id;

grant usage on schema public to anon, authenticated;
grant select on public.tables, public.group_counts to anon, authenticated;

-- "Anna  Svensson " and "anna svensson" are the same name.
create or replace function public.normalize_text(input text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(btrim(coalesce(input, '')), '\s+', ' ', 'g'));
$$;

-- Start a group on a free card. The creator joins at once.
-- Errors come back as plain codes that the app translates.
create or replace function public.create_table(
  p_slot     integer,
  p_name     text,
  p_creator  text,
  p_capacity integer default 10
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if length(normalize_text(p_name)) = 0    then raise exception 'table_name_required'; end if;
  if length(normalize_text(p_creator)) = 0 then raise exception 'name_required'; end if;
  if p_capacity < 1 or p_capacity > 100    then raise exception 'bad_capacity'; end if;

  insert into tables (slot, name, capacity)
    values (p_slot, btrim(p_name), p_capacity)
    returning id into v_id;

  insert into guests (table_id, name, name_key)
    values (v_id, btrim(p_creator), normalize_text(p_creator));

  return v_id;
exception
  when unique_violation then
    raise exception 'slot_taken';
end;
$$;

-- Join a group. It must have room, and the same name cannot join twice.
create or replace function public.join_table(
  p_table_id uuid,
  p_name     text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_count    integer;
  v_id       uuid;
begin
  if length(normalize_text(p_name)) = 0 then raise exception 'name_required'; end if;

  select capacity into v_capacity from tables where id = p_table_id;
  if not found then raise exception 'table_not_found'; end if;

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

-- Leave a group: removes the member with that name.
create or replace function public.leave_table(
  p_table_id uuid,
  p_name     text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from guests
   where table_id = p_table_id
     and name_key = normalize_text(p_name);
  if not found then raise exception 'guest_not_found'; end if;
end;
$$;

grant execute on function public.normalize_text(text) to anon, authenticated;
grant execute on function public.create_table(integer, text, text, integer) to anon, authenticated;
grant execute on function public.join_table(uuid, text) to anon, authenticated;
grant execute on function public.leave_table(uuid, text) to anon, authenticated;
