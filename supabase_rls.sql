begin;

alter table public.profiles enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid() limit 1), '');
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_select_internal on public.profiles;
create policy profiles_select_internal
on public.profiles
for select
to authenticated
using (public.current_profile_role() in ('ceo','sales','ops','staff','agency_staff'));

drop policy if exists profiles_update_ceo on public.profiles;
create policy profiles_update_ceo
on public.profiles
for update
to authenticated
using (public.current_profile_role() = 'ceo')
with check (public.current_profile_role() = 'ceo');

revoke select (two_factor_code) on public.profiles from anon;
revoke select (two_factor_code) on public.profiles from authenticated;

alter table public.app_state enable row level security;

drop policy if exists app_state_deny_all on public.app_state;
create policy app_state_deny_all
on public.app_state
for all
to authenticated
using (false)
with check (false);

commit;
