-- Phase 6: operational time logs per campaign (PRD M12).

create type public.ops_activity as enum (
  'review',
  'rekap_metrik',
  'koordinasi_kreator',
  'koordinasi_klien',
  'pembayaran',
  'laporan',
  'lainnya'
);

create table public.ops_time_logs (
  id uuid primary key default gen_random_uuid(),
  -- Time logs are operational notes only, so they go with a deleted campaign.
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  activity public.ops_activity not null,
  minutes integer not null,
  log_date date not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ops_time_logs_minutes_check check (minutes between 1 and 1440),
  constraint ops_time_logs_notes_check check (length(notes) <= 1000)
);

create index ops_time_logs_campaign_idx on public.ops_time_logs (campaign_id, log_date desc);

create trigger ops_time_logs_set_updated_at
  before update on public.ops_time_logs
  for each row
  execute function public.set_updated_at();

-- An entry stays with the campaign and the person who logged it.
create or replace function public.guard_ops_time_log_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.campaign_id is distinct from old.campaign_id
    or new.user_id is distinct from old.user_id then
    raise exception 'OPS_LOG_OWNER_FIXED: campaign and user of a time log cannot change';
  end if;
  return new;
end;
$$;

create trigger ops_time_logs_guard
  before update on public.ops_time_logs
  for each row
  execute function public.guard_ops_time_log_change();

alter table public.ops_time_logs enable row level security;

create policy "ops_time_logs_select_active_members"
  on public.ops_time_logs for select to authenticated
  using (public.is_active_member());

-- Everyone logs their own time only.
create policy "ops_time_logs_insert_own"
  on public.ops_time_logs for insert to authenticated
  with check (public.is_active_member() and user_id = (select auth.uid()));

-- Own entries, or any entry for the owner.
create policy "ops_time_logs_update_own_or_owner"
  on public.ops_time_logs for update to authenticated
  using (public.is_active_member() and (user_id = (select auth.uid()) or public.is_owner()))
  with check (public.is_active_member() and (user_id = (select auth.uid()) or public.is_owner()));

create policy "ops_time_logs_delete_own_or_owner"
  on public.ops_time_logs for delete to authenticated
  using (public.is_active_member() and (user_id = (select auth.uid()) or public.is_owner()));
