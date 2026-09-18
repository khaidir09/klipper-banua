-- Phase 4: metric snapshots and registrant reports (PRD M7, sections 7 and 8.5).

create type public.metric_checkpoint as enum ('H+1', 'H+3', 'H+7', 'akhir', 'lainnya');

create table public.metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  -- Restrict: snapshots feed payouts and reports.
  content_id uuid not null references public.contents (id) on delete restrict,
  checkpoint public.metric_checkpoint not null,
  captured_at timestamptz not null,
  views bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  -- FR-M7-01: the screenshot proof is mandatory.
  proof_path text not null,
  entered_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metric_snapshots_counts_check check (
    views >= 0 and likes >= 0 and comments >= 0 and shares >= 0 and saves >= 0
  ),
  constraint metric_snapshots_proof_check check (length(trim(proof_path)) > 0)
);

-- One snapshot per fixed checkpoint; `lainnya` (other) may repeat.
create unique index metric_snapshots_checkpoint_key
  on public.metric_snapshots (content_id, checkpoint)
  where checkpoint <> 'lainnya';

create index metric_snapshots_content_idx on public.metric_snapshots (content_id, captured_at);

create trigger metric_snapshots_set_updated_at
  before update on public.metric_snapshots
  for each row
  execute function public.set_updated_at();

create table public.registrant_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  -- Null means "tanpa kode": registrants the campus could not attribute.
  campaign_creator_id uuid references public.campaign_creators (id) on delete restrict,
  period_start date not null,
  period_end date not null,
  -- Aggregate number only; no registrant personal data is ever stored (PRD 4.2).
  registrant_count integer not null,
  proof_path text,
  -- The person uploading confirms the proof shows totals only, no names/IDs/phones.
  proof_confirmed_no_personal_data boolean not null default false,
  notes text not null default '',
  entered_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registrant_reports_count_check check (registrant_count >= 0),
  constraint registrant_reports_period_check check (period_end >= period_start),
  constraint registrant_reports_proof_confirmation_check check (
    proof_path is null or proof_confirmed_no_personal_data
  )
);

create index registrant_reports_campaign_idx on public.registrant_reports (campaign_id);
create index registrant_reports_assignment_idx on public.registrant_reports (campaign_creator_id);

create trigger registrant_reports_set_updated_at
  before update on public.registrant_reports
  for each row
  execute function public.set_updated_at();

-- Snapshot rules: only for content that went live, never before posting,
-- and closed campaigns stay owner-only.
create or replace function public.guard_metric_snapshot_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
begin
  select * into v_content from public.contents where id = coalesce(new.content_id, old.content_id);

  if (select auth.uid()) is not null then
    perform public.assert_campaign_editable(public.content_campaign_id(v_content.campaign_creator_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if v_content.posted_at is null or v_content.live_status = 'belum_tayang' then
    raise exception 'SNAPSHOT_NEEDS_LIVE_CONTENT: metrics are recorded for live content only';
  end if;

  if new.captured_at < v_content.posted_at then
    raise exception 'SNAPSHOT_BEFORE_POSTING: captured_at cannot precede posted_at';
  end if;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.entered_by := (select auth.uid());
  end if;

  return new;
end;
$$;

create trigger metric_snapshots_guard
  before insert or update or delete on public.metric_snapshots
  for each row
  execute function public.guard_metric_snapshot_change();

create or replace function public.guard_registrant_report_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.campaign_creator_id is not null and not exists (
    select 1 from public.campaign_creators
    where id = new.campaign_creator_id and campaign_id = new.campaign_id
  ) then
    raise exception 'REPORT_ASSIGNMENT_MISMATCH: the referral code belongs to another campaign';
  end if;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.entered_by := (select auth.uid());
  end if;

  return new;
end;
$$;

create trigger registrant_reports_guard
  before insert or update or delete on public.registrant_reports
  for each row
  execute function public.guard_registrant_report_change();

-- PRD 8.5: referral code and slug also freeze once a registrant report
-- references the assignment (phase 2 only checked clicks).
create or replace function public.guard_campaign_creator_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator_status public.creator_status;
begin
  perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));

  if tg_op = 'DELETE' then
    return old;
  end if;

  select status into v_creator_status from public.creators where id = new.creator_id;

  if v_creator_status = 'diblokir' then
    raise exception 'CREATOR_BLOCKED: a blocked creator cannot be assigned';
  end if;

  if tg_op = 'INSERT' and v_creator_status not in ('terverifikasi', 'aktif') then
    raise exception 'CREATOR_NOT_VERIFIED: only verified or active creators can be assigned';
  end if;

  if tg_op = 'UPDATE'
    and (new.referral_code is distinct from old.referral_code
      or new.tracking_slug is distinct from old.tracking_slug)
    and (
      exists (select 1 from public.link_clicks where campaign_creator_id = old.id)
      or exists (select 1 from public.registrant_reports where campaign_creator_id = old.id)
    )
  then
    raise exception 'TRACKING_FROZEN: code and slug cannot change after clicks or registrant reports';
  end if;

  return new;
end;
$$;

alter table public.metric_snapshots enable row level security;

create policy "metric_snapshots_select_active_members"
  on public.metric_snapshots for select to authenticated
  using (public.is_active_member());

create policy "metric_snapshots_insert_active_members"
  on public.metric_snapshots for insert to authenticated
  with check (public.is_active_member());

create policy "metric_snapshots_update_active_members"
  on public.metric_snapshots for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "metric_snapshots_delete_active_members"
  on public.metric_snapshots for delete to authenticated
  using (public.is_active_member());

alter table public.registrant_reports enable row level security;

create policy "registrant_reports_select_active_members"
  on public.registrant_reports for select to authenticated
  using (public.is_active_member());

create policy "registrant_reports_insert_active_members"
  on public.registrant_reports for insert to authenticated
  with check (public.is_active_member());

create policy "registrant_reports_update_active_members"
  on public.registrant_reports for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "registrant_reports_delete_active_members"
  on public.registrant_reports for delete to authenticated
  using (public.is_active_member());

-- Private bucket for metric screenshots and registrant-report proofs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'metric-proofs',
  'metric-proofs',
  false,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "metric_proofs_objects_select_active_members"
  on storage.objects for select to authenticated
  using (bucket_id = 'metric-proofs' and public.is_active_member());

create policy "metric_proofs_objects_insert_active_members"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'metric-proofs' and public.is_active_member());

create policy "metric_proofs_objects_delete_active_members"
  on storage.objects for delete to authenticated
  using (bucket_id = 'metric-proofs' and public.is_active_member());
