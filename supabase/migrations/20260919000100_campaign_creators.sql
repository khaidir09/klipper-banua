-- Phase 2: creator assignments, referral codes, tracking links and clicks
-- (PRD M5, sections 7 and 8.5).

create type public.assignment_status as enum ('diundang', 'bergabung', 'mundur', 'selesai');

create table public.campaign_creators (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  -- Restrict: assignments carry click and payout history.
  creator_id uuid not null references public.creators (id) on delete restrict,
  status public.assignment_status not null default 'diundang',
  contents_committed integer not null default 1,
  -- Fee overrides; null means "use the campaign default" (PRD 8.1).
  base_fee bigint,
  bonus_per_1000_views bigint,
  bonus_per_registrant bigint,
  views_bonus_cap bigint,
  referral_code text not null,
  tracking_slug text not null,
  joined_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_creators_campaign_creator_key unique (campaign_id, creator_id),
  constraint campaign_creators_referral_code_key unique (referral_code),
  constraint campaign_creators_tracking_slug_key unique (tracking_slug),
  -- Uppercase letters and digits without look-alikes (no I, O, 0, 1), 6–8 chars (FR-M5-03).
  constraint campaign_creators_referral_code_format check (referral_code ~ '^[A-HJ-NP-Z2-9]{6,8}$'),
  constraint campaign_creators_tracking_slug_format check (
    tracking_slug ~ '^[a-z0-9]([a-z0-9-]{2,38}[a-z0-9])$'
  ),
  constraint campaign_creators_contents_check check (contents_committed >= 0),
  constraint campaign_creators_money_check check (
    (base_fee is null or base_fee >= 0)
    and (bonus_per_1000_views is null or bonus_per_1000_views >= 0)
    and (bonus_per_registrant is null or bonus_per_registrant >= 0)
    and (views_bonus_cap is null or views_bonus_cap >= 0)
  )
);

create index campaign_creators_campaign_idx on public.campaign_creators (campaign_id);
create index campaign_creators_creator_idx on public.campaign_creators (creator_id);

create trigger campaign_creators_set_updated_at
  before update on public.campaign_creators
  for each row
  execute function public.set_updated_at();

-- Written only by the /r/[slug] route handler with the service role.
create table public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  -- Restrict: click history must not disappear with an assignment.
  campaign_creator_id uuid not null references public.campaign_creators (id) on delete restrict,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  ip_hash text,
  is_bot boolean not null default false,
  created_at timestamptz not null default now()
);

create index link_clicks_assignment_idx on public.link_clicks (campaign_creator_id, clicked_at);

-- Assignment rules enforced in the database as a backstop to the app:
-- * only verified/active creators can be added (FR-M5-01);
-- * blocked creators can never be assigned (PRD 8.5);
-- * code and slug are frozen once a click exists (PRD 8.5);
-- * closed campaigns are owner-only (PRD 8.5).
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
    and exists (select 1 from public.link_clicks where campaign_creator_id = old.id)
  then
    raise exception 'TRACKING_FROZEN: code and slug cannot change after clicks were recorded';
  end if;

  return new;
end;
$$;

create trigger campaign_creators_guard
  before insert or update or delete on public.campaign_creators
  for each row
  execute function public.guard_campaign_creator_change();

-- Campaign status rules (FR-M4-02, PRD 8.5), mirrored in lib/campaigns/status.ts.
create or replace function public.guard_campaign_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  if old.status in ('selesai', 'dibatalkan') and not public.is_owner() then
    raise exception 'CAMPAIGN_LOCKED: only an owner can change a closed campaign';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('aktif', 'dibatalkan'))
      or (old.status = 'aktif' and new.status in ('selesai', 'dibatalkan'))
    ) then
      raise exception 'INVALID_TRANSITION: % -> % is not allowed', old.status, new.status;
    end if;

    if new.status = 'aktif' then
      if new.objective = 'pendaftar' and coalesce(trim(new.landing_url), '') = '' then
        raise exception 'ACTIVATION_NEEDS_LANDING_URL: registration campaigns need a landing URL';
      end if;

      if not exists (
        select 1 from public.campaign_creators
        where campaign_id = new.id and status in ('diundang', 'bergabung')
      ) then
        raise exception 'ACTIVATION_NEEDS_CREATOR: at least one creator must be assigned';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger campaigns_guard
  before update on public.campaigns
  for each row
  execute function public.guard_campaign_update();

alter table public.campaign_creators enable row level security;

create policy "campaign_creators_select_active_members"
  on public.campaign_creators for select to authenticated
  using (public.is_active_member());

create policy "campaign_creators_insert_active_members"
  on public.campaign_creators for insert to authenticated
  with check (public.is_active_member());

create policy "campaign_creators_update_active_members"
  on public.campaign_creators for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "campaign_creators_delete_active_members"
  on public.campaign_creators for delete to authenticated
  using (public.is_active_member());

-- Clicks are readable by the team; no insert/update/delete policy exists, so
-- only the service role (the redirect route) can write them.
alter table public.link_clicks enable row level security;

create policy "link_clicks_select_active_members"
  on public.link_clicks for select to authenticated
  using (public.is_active_member());
