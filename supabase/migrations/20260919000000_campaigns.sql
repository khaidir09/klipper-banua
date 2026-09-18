-- Phase 2: campaigns and campaign assets (PRD M4, section 7).

create type public.campaign_objective as enum ('pendaftar', 'awareness', 'event');

create type public.campaign_status as enum ('draft', 'aktif', 'selesai', 'dibatalkan');

create type public.asset_type as enum ('video', 'foto', 'dokumen', 'tautan');

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  code text not null,
  name text not null,
  objective public.campaign_objective not null default 'pendaftar',
  -- Brief
  brief text not null default '',
  must_do text[] not null default '{}',
  must_not text[] not null default '{}',
  hashtags text[] not null default '{}',
  paid_label_required boolean not null default true,
  landing_url text,
  -- Period
  start_date date not null,
  end_date date not null,
  min_live_days integer not null default 30,
  status public.campaign_status not null default 'draft',
  -- Commercial terms. Money is whole Rupiah in bigint (PRD section 7).
  package_price bigint not null default 0,
  target_contents integer not null default 0,
  target_views bigint not null default 0,
  target_registrants integer not null default 0,
  -- Default fee scheme; campaign_creators columns override these per creator.
  default_base_fee bigint not null default 0,
  default_bonus_per_1000_views bigint not null default 0,
  default_bonus_per_registrant bigint not null default 0,
  default_views_bonus_cap bigint,
  closing_notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_code_key unique (code),
  constraint campaigns_code_format check (code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' and length(code) <= 50),
  constraint campaigns_name_check check (length(trim(name)) > 0),
  constraint campaigns_period_check check (end_date >= start_date),
  constraint campaigns_min_live_days_check check (min_live_days >= 0),
  constraint campaigns_landing_url_check check (landing_url is null or landing_url ~ '^https?://'),
  constraint campaigns_money_check check (
    package_price >= 0
    and default_base_fee >= 0
    and default_bonus_per_1000_views >= 0
    and default_bonus_per_registrant >= 0
    and (default_views_bonus_cap is null or default_views_bonus_cap >= 0)
  ),
  constraint campaigns_targets_check check (
    target_contents >= 0 and target_views >= 0 and target_registrants >= 0
  )
);

create index campaigns_client_idx on public.campaigns (client_id);
create index campaigns_status_idx on public.campaigns (status);
create index campaigns_start_date_idx on public.campaigns (start_date desc);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row
  execute function public.set_updated_at();

create table public.campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  title text not null,
  type public.asset_type not null,
  file_path text,
  external_url text,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_assets_title_check check (length(trim(title)) > 0),
  -- Exactly one source: an uploaded file or an external link (FR-M4-03).
  constraint campaign_assets_source_check check (num_nonnulls(file_path, external_url) = 1),
  constraint campaign_assets_url_check check (external_url is null or external_url ~ '^https?://')
);

create index campaign_assets_campaign_idx on public.campaign_assets (campaign_id);

create trigger campaign_assets_set_updated_at
  before update on public.campaign_assets
  for each row
  execute function public.set_updated_at();

-- Closed campaigns (`selesai`, `dibatalkan`) can only be changed by an owner
-- (PRD 8.5). Service-role / direct SQL calls carry no JWT and pass through.
create or replace function public.assert_campaign_editable(p_campaign_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_status public.campaign_status;
begin
  if (select auth.uid()) is null or public.is_owner() then
    return;
  end if;

  select status into v_status from public.campaigns where id = p_campaign_id;
  if v_status in ('selesai', 'dibatalkan') then
    raise exception 'CAMPAIGN_LOCKED: only an owner can change a closed campaign';
  end if;
end;
$$;

revoke execute on function public.assert_campaign_editable(uuid) from anon;

create or replace function public.guard_campaign_asset_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));
  return coalesce(new, old);
end;
$$;

create trigger campaign_assets_guard
  before insert or update or delete on public.campaign_assets
  for each row
  execute function public.guard_campaign_asset_change();

alter table public.campaigns enable row level security;

create policy "campaigns_select_active_members"
  on public.campaigns for select to authenticated
  using (public.is_active_member());

create policy "campaigns_insert_active_members"
  on public.campaigns for insert to authenticated
  with check (public.is_active_member() and status = 'draft');

create policy "campaigns_update_active_members"
  on public.campaigns for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "campaigns_delete_owner"
  on public.campaigns for delete to authenticated
  using (public.is_owner());

alter table public.campaign_assets enable row level security;

create policy "campaign_assets_select_active_members"
  on public.campaign_assets for select to authenticated
  using (public.is_active_member());

create policy "campaign_assets_insert_active_members"
  on public.campaign_assets for insert to authenticated
  with check (public.is_active_member());

create policy "campaign_assets_update_active_members"
  on public.campaign_assets for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "campaign_assets_delete_active_members"
  on public.campaign_assets for delete to authenticated
  using (public.is_active_member());

-- Private bucket for campaign material. Large videos go through an external
-- link instead (PRD section 7.1).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-assets',
  'campaign-assets',
  false,
  50 * 1024 * 1024,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do nothing;

create policy "campaign_assets_objects_select_active_members"
  on storage.objects for select to authenticated
  using (bucket_id = 'campaign-assets' and public.is_active_member());

create policy "campaign_assets_objects_insert_active_members"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'campaign-assets' and public.is_active_member());

create policy "campaign_assets_objects_delete_active_members"
  on storage.objects for delete to authenticated
  using (bucket_id = 'campaign-assets' and public.is_active_member());
