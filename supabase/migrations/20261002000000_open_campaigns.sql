-- Phase 16 (v4.0): open campaigns and the klipper catalog (PRD M17,
-- FR-M4-02, FR-M5-01, FR-M13-03, FR-M13-10).
--
-- 1. Campaigns gain an access mode (`terbuka` / `undangan`) and a payout model
--    (`per_views` / `paket`). Every existing campaign keeps working as
--    `paket` + `undangan`; new ones default to `per_views` + `terbuka`, and
--    the app can no longer create `paket` campaigns (PRD 5.3).
-- 2. Activation, budget and rate rules for `per_views` (FR-M17-02, FR-M17-07).
-- 3. A klipper joins an open campaign by inserting their own assignment. The
--    trigger decides everything on that row - status, timestamps, code, slug -
--    and refuses fee overrides (FR-M17-04). They may withdraw while no clip of
--    theirs was approved (FR-M17-05).
-- 4. The catalog view and the material of open campaigns (FR-M17-03, PRD 7.4).
--
-- Honor spent (`campaign_creator_cost`) is 0 until the ledger arrives in
-- Phase 17, which redefines that one function; every rule below already
-- reads it, so "budget exhausted" starts working without further changes.

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------
create type public.campaign_access as enum ('terbuka', 'undangan');
create type public.payout_model as enum ('per_views', 'paket');
create type public.assignment_join_source as enum ('mandiri', 'tim');

-- Added with the legacy values as default so existing rows are backfilled,
-- then switched to the v4.0 defaults.
alter table public.campaigns
  add column access public.campaign_access not null default 'undangan',
  add column payout_model public.payout_model not null default 'paket',
  add column rate_per_1000_views bigint not null default 0,
  add column creator_budget bigint not null default 0,
  add column max_payout_per_clip bigint,
  add column max_payout_per_creator bigint,
  add column min_views_to_earn bigint not null default 0,
  add column max_clips_per_creator integer not null default 3,
  add column allowed_platforms public.social_platform[] not null default '{}',
  add column local_only boolean not null default false,
  add column claim_grace_days integer not null default 3,
  add column published_at timestamptz;

alter table public.campaigns
  alter column access set default 'terbuka',
  alter column payout_model set default 'per_views';

alter table public.campaigns
  add constraint campaigns_per_views_money_check check (
    rate_per_1000_views >= 0
    and creator_budget >= 0
    and (max_payout_per_clip is null or max_payout_per_clip > 0)
    and (max_payout_per_creator is null or max_payout_per_creator > 0)
    and min_views_to_earn >= 0
  ),
  add constraint campaigns_max_clips_check check (max_clips_per_creator between 1 and 50),
  add constraint campaigns_claim_grace_days_check check (claim_grace_days between 0 and 60),
  -- Legacy package campaigns never enter the open catalog.
  add constraint campaigns_paket_invite_only check (payout_model = 'per_views' or access = 'undangan');

comment on column public.campaigns.access is
  'FR-M17-01: terbuka = listed in the portal catalog, klippers join themselves; undangan = team-assigned only.';
comment on column public.campaigns.payout_model is
  'FR-M17-01: per_views (v4.0) or paket (campaigns created before v4.0). Fixed once the campaign leaves draft.';
comment on column public.campaigns.creator_budget is
  'FR-M17-01: honor budget for klippers in whole Rupiah. Never shown to klippers as an amount.';

create index campaigns_catalog_idx on public.campaigns (status, access, end_date);

alter table public.campaign_creators
  add column join_source public.assignment_join_source not null default 'tim',
  add column withdrawn_at timestamptz;

comment on column public.campaign_creators.join_source is
  'mandiri = the klipper joined from the catalog (FR-M17-04); tim = added by the team.';

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

-- The business day in the default display timezone (PRD section 9), so
-- "end_date >= today" means the same thing in the app and the database.
-- Mirrored by campaignToday() in lib/campaigns/open.ts.
create or replace function public.campaign_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Makassar')::date;
$$;

-- Honor spent on a campaign (PRD 8.4 creator_cost). Phase 17 replaces the
-- body with the ledger sum; until then nothing has been credited.
create or replace function public.campaign_creator_cost(target_campaign_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select 0::bigint;
$$;

-- FR-M17-06: the rest cannot pay for 1,000 more views. Mirrored by
-- isBudgetExhausted() in lib/calculations/campaign-budget.ts.
create or replace function public.campaign_budget_exhausted(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select c.creator_budget - public.campaign_creator_cost(c.id) < c.rate_per_1000_views
      from public.campaigns c
      where c.id = target_campaign_id
    ),
    true
  );
$$;

-- An open campaign a klipper may browse: running, listed, not past its end.
create or replace function public.campaign_open_for_catalog(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = target_campaign_id
      and c.status = 'aktif'
      and c.access = 'terbuka'
      and c.payout_model = 'per_views'
      and c.end_date >= public.campaign_today()
  );
$$;

-- The version of the Syarat Klipper a klipper must have accepted to join or
-- send clips (FR-M3-04). Must equal CREATOR_TERMS_VERSION in
-- lib/constants/creators.ts; lib/constants/terms-version.test.ts checks it.
-- Bump both together with a new migration.
create or replace function public.current_creator_terms_version()
returns text
language sql
immutable
set search_path = ''
as $$
  select '2026-10'::text;
$$;

-- Referral code and tracking slug generators, same alphabets and shapes as
-- lib/referral/generate.ts. Used by the portal join and as column defaults.
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.campaign_creators cc where cc.referral_code = code
    );
  end loop;
  return code;
end;
$$;

create or replace function public.generate_tracking_slug(stage_name text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  base text;
  suffix text;
  slug text;
  suffix_length int;
begin
  base := regexp_replace(lower(coalesce(stage_name, '')), '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '^-+|-+$', '', 'g');
  base := regexp_replace(left(base, 20), '-+$', '');
  suffix_length := case when length(base) >= 3 then 4 else 8 end;

  loop
    suffix := '';
    for i in 1..suffix_length loop
      suffix := suffix || substr(alphabet, 1 + floor(random() * 31)::int, 1);
    end loop;
    slug := case when length(base) >= 3 then base || '-' || suffix else suffix end;
    exit when not exists (
      select 1 from public.campaign_creators cc where cc.tracking_slug = slug
    );
  end loop;
  return slug;
end;
$$;

-- Defaults run as the inserting user; the team and the portal both insert.
revoke execute on function public.generate_referral_code() from public, anon;
revoke execute on function public.generate_tracking_slug(text) from public, anon;
grant execute on function public.generate_referral_code() to authenticated;
grant execute on function public.generate_tracking_slug(text) to authenticated;

alter table public.campaign_creators
  alter column referral_code set default public.generate_referral_code(),
  alter column tracking_slug set default public.generate_tracking_slug(null);

revoke execute on function public.campaign_creator_cost(uuid) from anon;
revoke execute on function public.campaign_budget_exhausted(uuid) from anon;
revoke execute on function public.campaign_open_for_catalog(uuid) from anon;

-- Campaign material a klipper may download: campaigns they are on, and open
-- catalog campaigns once their account is active (PRD 7.4). A `prospek`
-- reads the brief but downloads nothing until they add a social account.
create or replace function public.creator_can_view_campaign_assets(target_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.creator_assigned_to_campaign(target_campaign_id)
    or (
      public.campaign_open_for_catalog(target_campaign_id)
      and exists (
        select 1 from public.creators c
        where c.id = public.current_creator_id()
          and c.status in ('aktif', 'terverifikasi')
      )
    );
$$;

revoke execute on function public.creator_can_view_campaign_assets(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 3. Campaign rules
-- ---------------------------------------------------------------------------

-- New campaigns cannot be `paket` (PRD 5.3) and are never published yet.
-- Service role, seeds and migrations carry no JWT and pass through.
create or replace function public.guard_campaign_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.published_at := null;
  if (select auth.uid()) is not null and new.payout_model = 'paket' then
    raise exception 'PAKET_RETIRED: new campaigns use the per_views payout model';
  end if;
  return new;
end;
$$;

create trigger campaigns_guard_insert
  before insert on public.campaigns
  for each row
  execute function public.guard_campaign_insert();

-- Status rules (FR-M4-02, FR-M17-02, PRD 8.5) and the money rules of
-- FR-M17-07. Mirrored in lib/campaigns/status.ts.
create or replace function public.guard_campaign_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The trigger owns the publication stamp: set once, on the first time the
  -- campaign runs as an open campaign.
  new.published_at := case
    when new.status = 'aktif' and new.access = 'terbuka' then coalesce(old.published_at, now())
    else old.published_at
  end;

  if (select auth.uid()) is null then
    return new;
  end if;

  if old.status in ('selesai', 'dibatalkan') and not public.is_owner() then
    raise exception 'CAMPAIGN_LOCKED: only an owner can change a closed campaign';
  end if;

  if new.payout_model is distinct from old.payout_model then
    if new.payout_model = 'paket' then
      raise exception 'PAKET_RETIRED: new campaigns use the per_views payout model';
    end if;
    if old.status <> 'draft' then
      raise exception 'PAYOUT_MODEL_LOCKED: the payout model is fixed once the campaign is active';
    end if;
  end if;

  if new.rate_per_1000_views is distinct from old.rate_per_1000_views
    and exists (
      select 1
      from public.contents ct
      join public.campaign_creators cc on cc.id = ct.campaign_creator_id
      where cc.campaign_id = old.id and ct.review_status = 'disetujui'
    )
  then
    raise exception 'RATE_LOCKED: the rate cannot change after a clip was approved';
  end if;

  if new.creator_budget < old.creator_budget
    and new.creator_budget < public.campaign_creator_cost(old.id)
  then
    raise exception 'BUDGET_BELOW_USED: the budget cannot go below the honor already spent';
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

      if new.payout_model = 'per_views' then
        if coalesce(trim(new.brief), '') = '' then
          raise exception 'ACTIVATION_NEEDS_BRIEF: the brief is empty';
        end if;
        if not exists (select 1 from public.campaign_assets a where a.campaign_id = new.id) then
          raise exception 'ACTIVATION_NEEDS_ASSET: at least one campaign asset is required';
        end if;
        if new.rate_per_1000_views <= 0 then
          raise exception 'ACTIVATION_NEEDS_RATE: the rate per 1,000 views must be above zero';
        end if;
        if new.creator_budget <= 0 then
          raise exception 'ACTIVATION_NEEDS_BUDGET: the klipper budget must be above zero';
        end if;
        if new.end_date < public.campaign_today() then
          raise exception 'ACTIVATION_PAST_END_DATE: the end date has passed';
        end if;
        if cardinality(new.allowed_platforms) = 0 then
          raise exception 'ACTIVATION_NEEDS_PLATFORM: pick at least one platform';
        end if;
      end if;

      -- FR-M4-02: an open campaign may start without klippers.
      if new.access = 'undangan' and not exists (
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

-- ---------------------------------------------------------------------------
-- 4. Joining (FR-M17-04) and assignment rules
-- ---------------------------------------------------------------------------
create or replace function public.guard_campaign_creator_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator public.creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_portal_creator uuid := public.current_creator_id();
begin
  perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));

  if tg_op = 'DELETE' then
    return old;
  end if;

  select * into v_creator from public.creators where id = new.creator_id;

  -- A klipper joining from the catalog. Checked in the order the portal
  -- explains them (lib/campaigns/open.ts joinBlockers).
  if tg_op = 'INSERT' and v_portal_creator is not null then
    if new.creator_id is distinct from v_portal_creator then
      raise exception 'PORTAL_FIELD_LOCKED: a klipper can only join for themselves';
    end if;

    if num_nonnulls(new.base_fee, new.bonus_per_1000_views, new.bonus_per_registrant, new.views_bonus_cap) > 0 then
      raise exception 'PORTAL_FIELD_LOCKED: fee columns belong to the team';
    end if;

    select * into v_campaign from public.campaigns where id = new.campaign_id;

    if v_creator.status not in ('aktif', 'terverifikasi') then
      raise exception 'JOIN_CREATOR_NOT_ACTIVE: add a social account before joining';
    end if;

    if v_creator.terms_version is distinct from public.current_creator_terms_version() then
      raise exception 'JOIN_TERMS_OUTDATED: accept the latest terms first';
    end if;

    if v_campaign.id is null
      or v_campaign.status <> 'aktif'
      or v_campaign.access <> 'terbuka'
      or v_campaign.payout_model <> 'per_views'
    then
      raise exception 'JOIN_CAMPAIGN_CLOSED: the campaign is not open for joining';
    end if;

    if v_campaign.end_date < public.campaign_today() then
      raise exception 'JOIN_PAST_DEADLINE: the campaign has ended';
    end if;

    if public.campaign_budget_exhausted(v_campaign.id) then
      raise exception 'JOIN_BUDGET_EXHAUSTED: the campaign budget is used up';
    end if;

    if v_campaign.local_only and v_creator.verified_at is null then
      raise exception 'JOIN_LOCAL_ONLY: this campaign is for Klipper Lokal badge holders';
    end if;

    -- Everything else on the row comes from the server, whatever was sent.
    new.status := 'bergabung';
    new.join_source := 'mandiri';
    new.joined_at := now();
    new.creator_confirmed_at := now();
    new.withdrawn_at := null;
    new.contents_committed := v_campaign.max_clips_per_creator;
    new.referral_code := public.generate_referral_code();
    new.tracking_slug := public.generate_tracking_slug(v_creator.stage_name);
    new.created_by := (select auth.uid());
    return new;
  end if;

  if v_creator.status = 'diblokir' then
    raise exception 'CREATOR_BLOCKED: a blocked creator cannot be assigned';
  end if;

  if tg_op = 'INSERT' and v_creator.status not in ('terverifikasi', 'aktif') then
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

  -- The withdrawal stamp follows the status, whoever changes it.
  if new.status = 'mundur' then
    new.withdrawn_at := case
      when tg_op = 'UPDATE' and old.status = 'mundur' then old.withdrawn_at
      else coalesce(new.withdrawn_at, now())
    end;
  else
    new.withdrawn_at := null;
  end if;

  return new;
end;
$$;

-- What a portal klipper may change on their own assignment: confirm an
-- invitation (FR-M13-10) or withdraw from a per_views campaign while no clip
-- of theirs was approved (FR-M17-05).
create or replace function public.guard_portal_assignment_confirm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Listing what may move, instead of what may not, keeps a column added
  -- later locked by default.
  v_allowed text[] := array['status', 'joined_at', 'creator_confirmed_at', 'withdrawn_at', 'updated_at'];
  v_payout_model public.payout_model;
begin
  if public.current_creator_id() is null then
    return new;
  end if;

  if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
    raise exception 'PORTAL_FIELD_LOCKED: only the team can change that';
  end if;

  if old.status = 'diundang' and new.status = 'bergabung' then
    -- Written here, so the confirmation carries the server's clock.
    new.joined_at := coalesce(old.joined_at, now());
    new.creator_confirmed_at := now();
    new.withdrawn_at := old.withdrawn_at;
    return new;
  end if;

  if old.status = 'bergabung' and new.status = 'mundur' then
    select payout_model into v_payout_model from public.campaigns where id = old.campaign_id;
    if v_payout_model is distinct from 'per_views' then
      raise exception 'WITHDRAW_NOT_ALLOWED: ask the team to withdraw from a package campaign';
    end if;
    if exists (
      select 1 from public.contents ct
      where ct.campaign_creator_id = old.id and ct.review_status = 'disetujui'
    ) then
      raise exception 'WITHDRAW_HAS_APPROVED_CLIP: a klipper with an approved clip cannot withdraw';
    end if;
    new.joined_at := old.joined_at;
    new.creator_confirmed_at := old.creator_confirmed_at;
    new.withdrawn_at := now();
    return new;
  end if;

  raise exception 'PORTAL_CONFIRM_ONLY: the portal can only confirm an invitation or withdraw';
end;
$$;

-- A klipper inserts only their own assignment; the trigger above decides the
-- rest. Reading it back goes through creator_portal_assignments.
create policy "campaign_creators_insert_portal_creator"
  on public.campaign_creators for insert to authenticated
  with check (
    creator_id = public.current_creator_id()
    and public.campaign_open_for_catalog(campaign_id)
  );

-- ---------------------------------------------------------------------------
-- 5. Terms re-acceptance (FR-M3-04)
-- ---------------------------------------------------------------------------
create or replace function public.accept_creator_terms()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_creator_id();
  v_version text := public.current_creator_terms_version();
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no creator for this account';
  end if;

  update public.creators
  set terms_version = v_version,
      terms_agreed_at = now()
  where id = me
    and terms_version is distinct from v_version;

  if found then
    insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
    values ((select auth.uid()), 'creator', me, 'accept_terms', jsonb_build_object('terms_version', v_version));
  end if;

  return v_version;
end;
$$;

revoke execute on function public.accept_creator_terms() from public, anon;
grant execute on function public.accept_creator_terms() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Campaign material of open campaigns (PRD 7.4)
-- ---------------------------------------------------------------------------
create policy "campaign_assets_objects_select_open_catalog"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.creator_can_view_campaign_assets(((storage.foldername(name))[1])::uuid)
  );

create or replace view public.creator_portal_assets
with (security_invoker = off) as
select
  a.id,
  a.campaign_id,
  a.title,
  a.type,
  a.file_path,
  a.external_url,
  a.notes,
  a.created_at
from public.campaign_assets a
where public.creator_can_view_campaign_assets(a.campaign_id);

comment on view public.creator_portal_assets is
  'FR-M13-04, PRD 7.4: material of the campaigns this klipper is on, and of open catalog campaigns once their account is active.';

-- ---------------------------------------------------------------------------
-- 7. Portal read surface
-- ---------------------------------------------------------------------------

-- FR-M17-03. Budget is shown as a percentage only; package price, targets,
-- the budget amount and internal notes never appear. Readable by an `aktif`
-- or `prospek` klipper (a prospect sees the catalog but cannot join yet).
create view public.creator_portal_catalog
with (security_invoker = off) as
select
  c.id,
  c.code,
  c.name,
  cl.name as client_name,
  c.objective,
  c.brief,
  c.must_do,
  c.must_not,
  c.hashtags,
  c.paid_label_required,
  c.allowed_platforms,
  c.rate_per_1000_views,
  c.max_payout_per_clip,
  c.max_payout_per_creator,
  c.min_views_to_earn,
  c.max_clips_per_creator,
  c.local_only,
  c.start_date,
  c.end_date,
  c.min_live_days,
  c.claim_grace_days,
  c.published_at,
  -- Mirrors budgetRemainingPct() in lib/calculations/campaign-budget.ts.
  case
    when c.creator_budget > 0 then
      least(100, greatest(0, c.creator_budget - public.campaign_creator_cost(c.id)) * 100 / c.creator_budget)::integer
    else 0
  end as budget_remaining_pct,
  public.campaign_budget_exhausted(c.id) as budget_exhausted,
  (select count(*) from public.campaign_assets a where a.campaign_id = c.id)::integer as asset_count,
  cc.id as assignment_id,
  cc.status as assignment_status
from public.campaigns c
join public.clients cl on cl.id = c.client_id
left join public.campaign_creators cc
  on cc.campaign_id = c.id and cc.creator_id = public.current_creator_id()
where c.status = 'aktif'
  and c.access = 'terbuka'
  and c.payout_model = 'per_views'
  and c.end_date >= public.campaign_today()
  and exists (
    select 1 from public.creators me
    where me.id = public.current_creator_id()
      and me.status in ('aktif', 'terverifikasi', 'prospek')
  );

comment on view public.creator_portal_catalog is
  'FR-M17-03: open per_views campaigns for the signed-in klipper. No package_price, targets, budget amount or internal notes.';

revoke all on public.creator_portal_catalog from anon;
grant select on public.creator_portal_catalog to authenticated;

-- The klipper's own assignments with the per_views terms. New columns are
-- appended, so `create or replace view` accepts them.
create or replace view public.creator_portal_assignments
with (security_invoker = off) as
select
  cc.id,
  cc.campaign_id,
  cc.status,
  cc.contents_committed,
  cc.referral_code,
  cc.tracking_slug,
  cc.joined_at,
  coalesce(cc.base_fee, cp.default_base_fee) as base_fee,
  coalesce(cc.bonus_per_1000_views, cp.default_bonus_per_1000_views) as bonus_per_1000_views,
  coalesce(cc.bonus_per_registrant, cp.default_bonus_per_registrant) as bonus_per_registrant,
  coalesce(cc.views_bonus_cap, cp.default_views_bonus_cap) as views_bonus_cap,
  cp.code as campaign_code,
  cp.name as campaign_name,
  cp.objective as campaign_objective,
  cp.status as campaign_status,
  cp.brief,
  cp.must_do,
  cp.must_not,
  cp.hashtags,
  cp.paid_label_required,
  cp.landing_url,
  cp.start_date,
  cp.end_date,
  cp.min_live_days,
  cl.name as client_name,
  cc.creator_confirmed_at,
  cp.payout_model,
  cp.access,
  cp.rate_per_1000_views,
  cp.max_payout_per_clip,
  cp.max_payout_per_creator,
  cp.min_views_to_earn,
  cp.max_clips_per_creator,
  cp.allowed_platforms,
  cp.local_only,
  cp.claim_grace_days,
  cc.join_source,
  cc.withdrawn_at
from public.campaign_creators cc
join public.campaigns cp on cp.id = cc.campaign_id
join public.clients cl on cl.id = cp.client_id
where cc.creator_id = public.current_creator_id()
  and cp.status in ('aktif', 'selesai');
