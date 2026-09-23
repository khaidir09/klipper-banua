-- Phase 14 (v3.2): the creator confirms their own assignment (PRD M13:
-- FR-M13-10).
--
-- By the time a creator sees an assignment the deal is already closed over
-- WhatsApp and the campaign is running, so this is not a negotiation: it is
-- the creator's own dated acknowledgement that they read the brief and the
-- prohibitions and accept the terms. That record is what settles a later
-- argument about a missing paid label or content taken down too early
-- (PRD 8.2).
--
-- The rule stays "the creator fills in, the team decides": the only move the
-- portal may make is `diundang` -> `bergabung` on their own assignment, and
-- the timestamps are written by the trigger, never by the caller.

-- ---------------------------------------------------------------------------
-- 1. The acknowledgement itself.
-- ---------------------------------------------------------------------------
alter table public.campaign_creators
  add column creator_confirmed_at timestamptz;

comment on column public.campaign_creators.creator_confirmed_at is
  'When the creator confirmed the brief from the portal (FR-M13-10). Distinct from joined_at, which the team may also set by hand.';

-- Assignments that were already working before this phase keep working: one
-- with content is one the creator clearly accepted. `creator_confirmed_at`
-- stays null - nobody clicked anything - so the backfill only unblocks them.
update public.campaign_creators cc
  set status = 'bergabung',
      joined_at = coalesce(
        cc.joined_at,
        (select min(ct.created_at) from public.contents ct where ct.campaign_creator_id = cc.id)
      )
  where cc.status = 'diundang'
    and exists (select 1 from public.contents ct where ct.campaign_creator_id = cc.id);

-- ---------------------------------------------------------------------------
-- 2. Sending anything from the portal now requires having confirmed first.
--    `selesai` is included: an assignment can be wrapped up while the campaign
--    still runs, and the creator must stay able to report metrics for it.
-- ---------------------------------------------------------------------------
create or replace function public.creator_joined_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_creators cc
    join public.campaigns c on c.id = cc.campaign_id
    where cc.id = target_assignment_id
      and cc.creator_id = public.current_creator_id()
      and c.status = 'aktif'
      and cc.status in ('bergabung', 'selesai')
  );
$$;

create or replace function public.creator_joined_content(target_content_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.contents ct
    join public.campaign_creators cc on cc.id = ct.campaign_creator_id
    where ct.id = target_content_id
      and cc.creator_id = public.current_creator_id()
      and cc.status in ('bergabung', 'selesai')
  );
$$;

revoke execute on function public.creator_joined_assignment(uuid) from anon;
revoke execute on function public.creator_joined_content(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 3. What a portal creator may change on their own assignment. Same shape as
--    guard_portal_content_change: the team's path is left untouched.
-- ---------------------------------------------------------------------------
create or replace function public.guard_portal_assignment_confirm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Everything else - fee overrides, contents_committed, referral_code,
  -- tracking_slug - belongs to the team. Listing what may move, instead of
  -- what may not, keeps a column added later locked by default.
  v_allowed text[] := array['status', 'joined_at', 'creator_confirmed_at', 'updated_at'];
begin
  if public.current_creator_id() is null then
    return new;
  end if;

  if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
    raise exception 'PORTAL_FIELD_LOCKED: only the team can change that';
  end if;

  if not (old.status = 'diundang' and new.status = 'bergabung') then
    raise exception 'PORTAL_CONFIRM_ONLY: the portal can only confirm an invited assignment';
  end if;

  -- Written here, so the confirmation carries the server's clock.
  new.joined_at := coalesce(old.joined_at, now());
  new.creator_confirmed_at := now();

  return new;
end;
$$;

create trigger campaign_creators_guard_portal
  before update on public.campaign_creators
  for each row
  execute function public.guard_portal_assignment_confirm();

-- ---------------------------------------------------------------------------
-- 4. Row level security.
--    Postgres reads a row before it updates it, so the creator needs `select`
--    on their own assignment as well. The row holds nothing internal beyond
--    the fee overrides, which creator_portal_assignments already shows them.
-- ---------------------------------------------------------------------------
create policy "campaign_creators_select_portal_creator"
  on public.campaign_creators for select to authenticated
  using (public.creator_owns_assignment(id));

create policy "campaign_creators_update_portal_creator"
  on public.campaign_creators for update to authenticated
  using (public.creator_owns_assignment(id))
  with check (public.creator_owns_assignment(id));

-- Drafts, live reports and metric evidence now wait for the confirmation.
drop policy if exists "contents_insert_portal_creator" on public.contents;
create policy "contents_insert_portal_creator"
  on public.contents for insert to authenticated
  with check (public.creator_joined_assignment(campaign_creator_id));

drop policy if exists "contents_update_portal_creator" on public.contents;
create policy "contents_update_portal_creator"
  on public.contents for update to authenticated
  using (public.creator_joined_assignment(campaign_creator_id))
  with check (public.creator_joined_assignment(campaign_creator_id));

drop policy if exists "metric_submissions_insert_portal_creator" on public.metric_submissions;
create policy "metric_submissions_insert_portal_creator"
  on public.metric_submissions for insert to authenticated
  with check (public.creator_joined_content(content_id));

-- Reading stays on plain ownership: a creator keeps seeing their own history
-- whatever their assignment status becomes later.

-- ---------------------------------------------------------------------------
-- 5. The portal reads the acknowledgement back. The new column is appended,
--    so `create or replace view` accepts it.
-- ---------------------------------------------------------------------------
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
  cc.creator_confirmed_at
from public.campaign_creators cc
join public.campaigns cp on cp.id = cc.campaign_id
join public.clients cl on cl.id = cp.client_id
where cc.creator_id = public.current_creator_id()
  and cp.status in ('aktif', 'selesai');

comment on view public.creator_portal_assignments is
  'FR-M13-03, FR-M13-04, FR-M13-10: the creator own assignments, briefs and confirmation. Never exposes package_price, targets or margin.';
