-- Phase 0 foundation: internal user profiles, roles and row level security.
-- Product requirements: PRD FR-M1-01, FR-M1-03 and section 7 (data model).

-- Roles of the internal team. Enum values follow the PRD.
create type public.user_role as enum ('owner', 'manager');

-- Keeps `updated_at` in sync on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'manager',
  is_active boolean not null default true,
  -- Display timezone. Kalimantan spans WITA and WIB, see PRD section 9.
  timezone text not null default 'Asia/Makassar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_timezone_check check (timezone in ('Asia/Makassar', 'Asia/Jakarta'))
);

comment on table public.profiles is 'Internal team members. Created from auth.users; public signup is disabled.';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Creates the profile whenever an account is provisioned (invitation or seed script).
-- Role and full name are read from the metadata passed by the admin API.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'manager')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Role helpers. `security definer` keeps RLS policies from recursing into `profiles`.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'owner' and is_active from public.profiles where id = (select auth.uid())),
    false
  );
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_active from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.current_user_role() from anon;
revoke execute on function public.is_owner() from anon;
revoke execute on function public.is_active_member() from anon;

alter table public.profiles enable row level security;

-- Every member reads their own profile, even when deactivated, so the app can
-- show a clear "account disabled" message instead of an empty screen.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_select_all_active_members"
  on public.profiles
  for select
  to authenticated
  using (public.is_active_member());

-- Members may edit their own name and timezone. Role and is_active are locked
-- by the trigger below so nobody can promote themselves.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()) and public.is_active_member())
  with check (id = (select auth.uid()));

create policy "profiles_owner_update_all"
  on public.profiles
  for update
  to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- Inserts happen through the auth trigger, deletes through cascading auth.users
-- removal; no client-side policy is granted for either.

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service role and direct SQL (seeding, migrations) carry no JWT: let them through.
  if (select auth.uid()) is null or public.is_owner() then
    return new;
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    raise exception 'only an owner can change role or active status';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileges();
