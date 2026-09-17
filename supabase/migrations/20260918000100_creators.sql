-- Phase 1: creators, social accounts and the owner-only bank account table
-- (PRD M3, section 7). Enum values follow the PRD wording.

create type public.creator_tier as enum ('nano', 'mikro', 'menengah');

create type public.creator_status as enum (
  'prospek',
  'terverifikasi',
  'aktif',
  'nonaktif',
  'diblokir'
);

create type public.social_platform as enum ('tiktok', 'instagram', 'youtube', 'facebook');

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  stage_name text not null default '',
  phone_wa text not null default '',
  email text not null default '',
  city text not null default '',
  province text not null default '',
  birth_date date not null,
  niches text[] not null default '{}',
  tier public.creator_tier not null default 'nano',
  status public.creator_status not null default 'prospek',
  terms_version text,
  terms_agreed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creators_full_name_check check (length(trim(full_name)) > 0),
  -- The application validates age with a clear message (FR-M3-02); this is
  -- the last line of defence against a bypassed form.
  constraint creators_adult_check check (birth_date <= (current_date - interval '18 years')),
  -- A terms record needs both fields or neither.
  constraint creators_terms_pair_check check (
    (terms_version is null) = (terms_agreed_at is null)
  )
);

create index creators_status_idx on public.creators (status);
create index creators_tier_idx on public.creators (tier);
create index creators_province_idx on public.creators (province);
create index creators_city_idx on public.creators (city);
create index creators_niches_idx on public.creators using gin (niches);
create index creators_name_idx on public.creators (lower(full_name), lower(stage_name));

create trigger creators_set_updated_at
  before update on public.creators
  for each row
  execute function public.set_updated_at();

create table public.creator_social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  platform public.social_platform not null,
  handle text not null,
  profile_url text not null default '',
  followers_count integer not null default 0,
  kalimantan_audience_pct numeric(5, 2),
  top_cities text not null default '',
  audience_proof_path text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_social_accounts_handle_check check (length(trim(handle)) > 0),
  constraint creator_social_accounts_followers_check check (followers_count >= 0),
  constraint creator_social_accounts_pct_check check (
    kalimantan_audience_pct is null
    or (kalimantan_audience_pct >= 0 and kalimantan_audience_pct <= 100)
  ),
  constraint creator_social_accounts_platform_handle_key unique (platform, handle)
);

create index creator_social_accounts_creator_idx on public.creator_social_accounts (creator_id);
create index creator_social_accounts_platform_idx on public.creator_social_accounts (platform);

create trigger creator_social_accounts_set_updated_at
  before update on public.creator_social_accounts
  for each row
  execute function public.set_updated_at();

create table public.creator_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creators (id) on delete cascade,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_bank_accounts_number_check check (account_number ~ '^[0-9]{4,}$')
);

create trigger creator_bank_accounts_set_updated_at
  before update on public.creator_bank_accounts
  for each row
  execute function public.set_updated_at();

-- creators / creator_social_accounts: both roles operate them.
alter table public.creators enable row level security;

create policy "creators_select_active_members"
  on public.creators for select to authenticated
  using (public.is_active_member());

create policy "creators_insert_active_members"
  on public.creators for insert to authenticated
  with check (public.is_active_member());

create policy "creators_update_active_members"
  on public.creators for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "creators_delete_owner"
  on public.creators for delete to authenticated
  using (public.is_owner());

alter table public.creator_social_accounts enable row level security;

create policy "creator_social_accounts_select_active_members"
  on public.creator_social_accounts for select to authenticated
  using (public.is_active_member());

create policy "creator_social_accounts_insert_active_members"
  on public.creator_social_accounts for insert to authenticated
  with check (public.is_active_member());

create policy "creator_social_accounts_update_active_members"
  on public.creator_social_accounts for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "creator_social_accounts_delete_active_members"
  on public.creator_social_accounts for delete to authenticated
  using (public.is_active_member());

-- creator_bank_accounts: owner only (FR-M3-06). No policy exists for
-- managers, so a direct query returns zero rows.
alter table public.creator_bank_accounts enable row level security;

create policy "creator_bank_accounts_select_owner"
  on public.creator_bank_accounts for select to authenticated
  using (public.is_owner());

create policy "creator_bank_accounts_insert_owner"
  on public.creator_bank_accounts for insert to authenticated
  with check (public.is_owner());

create policy "creator_bank_accounts_update_owner"
  on public.creator_bank_accounts for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy "creator_bank_accounts_delete_owner"
  on public.creator_bank_accounts for delete to authenticated
  using (public.is_owner());

-- Managers only ever see the bank name and the last four digits.
create or replace function public.get_masked_bank_account(p_creator_id uuid)
returns table (bank_name text, account_number_masked text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.bank_name,
    repeat('*', greatest(length(b.account_number) - 4, 0)) || right(b.account_number, 4)
  from public.creator_bank_accounts b
  where b.creator_id = p_creator_id
    and public.is_active_member();
$$;

revoke execute on function public.get_masked_bank_account(uuid) from anon;
