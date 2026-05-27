-- =============================================================
-- The Way Platform — Supabase Schema
-- Run this entire file in Supabase → SQL Editor → New query
-- =============================================================

-- ─── 1. PROFILES TABLE ───────────────────────────────────────
-- One row per user. id references auth.users(id).
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text not null unique,
  role                 text not null default 'student',
  name                 text not null default '',
  email                text not null default '',
  phone                text,
  "createdAt"          text,
  points               integer not null default 0,
  "staffUniversities"  jsonb,
  "assignedUniversityId" text,
  "passportExpiry"     text,
  "visaExpiry"         text,
  "residenceExpiry"    text
);

-- ─── 2. APP_STATE TABLE ──────────────────────────────────────
-- Single row keyed by org_id='default' stores all shared state
-- (applications, documents, notifications, appointments, chat).
create table if not exists public.app_state (
  org_id  text primary key default 'default',
  state   jsonb not null default '{}'::jsonb
);

-- Seed the single shared state row so it always exists.
insert into public.app_state (org_id, state)
values ('default', '{"applications":[],"documents":[],"notifications":[],"appointments":[],"chatMessages":[],"chatThreadReadAt":{}}'::jsonb)
on conflict (org_id) do nothing;

-- ─── 3. ROW-LEVEL SECURITY ───────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.app_state enable row level security;

-- Helper: returns the current user's role from profiles.
create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() limit 1),
    ''
  );
$$;

revoke all  on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

-- PROFILES policies --

-- Each user can read their own row.
drop policy if exists profiles_select_self       on public.profiles;
create policy profiles_select_self
  on public.profiles for select to authenticated
  using (id = auth.uid());

-- Internal roles (ceo, sales, ops, staff, agency_staff) can read all rows.
drop policy if exists profiles_select_internal   on public.profiles;
create policy profiles_select_internal
  on public.profiles for select to authenticated
  using (public.current_profile_role() in ('ceo','sales','ops','staff','agency_staff'));

-- Only CEO can update profiles via the API (server uses service role key which bypasses RLS anyway).
drop policy if exists profiles_update_ceo        on public.profiles;
create policy profiles_update_ceo
  on public.profiles for update to authenticated
  using (public.current_profile_role() = 'ceo')
  with check (public.current_profile_role() = 'ceo');

-- Hide the legacy 2FA column from all clients (the column may not exist — safe to run regardless).
do $$ begin
  alter table public.profiles add column if not exists two_factor_code text;
exception when duplicate_column then null; end $$;

revoke select (two_factor_code) on public.profiles from anon;
revoke select (two_factor_code) on public.profiles from authenticated;

-- APP_STATE policies --

-- Service-role key bypasses RLS, so the API can always read/write.
-- Deny all direct client access to prevent accidental data exposure.
drop policy if exists app_state_deny_all         on public.app_state;
create policy app_state_deny_all
  on public.app_state for all to authenticated
  using (false)
  with check (false);

-- ─── 4. INDEXES ──────────────────────────────────────────────
create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_role_idx     on public.profiles (role);
