-- Phase 11 (v3.0): client portal access and monitoring (PRD M14:
-- FR-M14-01, FR-M14-02, FR-M14-03).
--
-- A client contact signs in with the `client` role and reaches /klien only.
-- Ownership runs client_contacts → clients → campaigns, so a contact sees the
-- campaigns of their own institution and nothing else. As with the creator
-- portal, reads go through the `client_portal_*` views at the bottom of this
-- file: `campaigns` carries the package price and the fee scheme, and RLS
-- filters rows, not columns.

-- ---------------------------------------------------------------------------
-- 1. Link a client contact to their portal account.
-- ---------------------------------------------------------------------------
alter table public.client_contacts
  add column profile_id uuid unique references public.profiles (id) on delete set null,
  add column portal_invited_at timestamptz;

comment on column public.client_contacts.profile_id is
  'Portal account (profiles.role = client), set when the invitation is sent (FR-M14-01). One account per person, so an approval always names who gave it.';
comment on column public.client_contacts.portal_invited_at is
  'When the latest portal invitation was sent.';

-- ---------------------------------------------------------------------------
-- 2. Helpers. `security definer` so policies and views do not recurse, and so
--    a client cannot read the tables they query.
-- ---------------------------------------------------------------------------

-- The institution behind the current session, or null for anyone else.
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cc.client_id
  from public.client_contacts cc
  join public.profiles p on p.id = cc.profile_id
  where p.id = (select auth.uid())
    and p.is_active
    and p.role = 'client'
  limit 1;
$$;

-- True when the campaign belongs to the signed-in client and has left the
-- draft stage. Drafts and cancelled campaigns stay invisible.
create or replace function public.client_owns_campaign(target_campaign_id uuid)
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
      and c.client_id = public.current_client_id()
      and c.status in ('aktif', 'selesai')
  );
$$;

revoke execute on function public.current_client_id() from anon;
revoke execute on function public.client_owns_campaign(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 3. Portal access is granted and withdrawn by the team only.
-- ---------------------------------------------------------------------------
create or replace function public.protect_client_portal_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service role, seeds and migrations carry no JWT: let them through.
  if (select auth.uid()) is null or public.is_active_member() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
    or new.portal_invited_at is distinct from old.portal_invited_at then
    raise exception 'PORTAL_LINK_INTERNAL_ONLY: only the internal team can change portal access';
  end if;

  return new;
end;
$$;

create trigger client_contacts_protect_portal_link
  before update on public.client_contacts
  for each row
  execute function public.protect_client_portal_link();

-- ---------------------------------------------------------------------------
-- 4. The two policies a client gets, mirroring the creator portal.
-- ---------------------------------------------------------------------------

-- Own display name and timezone; the privilege trigger still blocks role and
-- is_active, and `profiles_select_own` covers reading it back.
create policy "profiles_update_own_portal_client"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and public.current_client_id() is not null)
  with check (id = (select auth.uid()));

-- Portal actions stay in the audit trail (FR-M11-01). Reading it remains
-- owner-only.
create policy "activity_logs_insert_portal_client"
  on public.activity_logs for insert to authenticated
  with check (
    public.current_client_id() is not null
    and actor_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 5. The portal's read surface. Same contract as the creator portal:
--    `security_invoker = off`, filtered on the signed-in client, whitelisted
--    columns, never readable by `anon`.
--
--    What never appears here: package_price, the fee scheme, payouts, client
--    payments, internal notes, and a creator's legal name, phone or bank
--    details. Creators are shown by stage name (FR-M14-03).
-- ---------------------------------------------------------------------------

create view public.client_portal_campaigns
with (security_invoker = off) as
select
  c.id,
  c.code,
  c.name,
  c.objective,
  c.status,
  c.brief,
  c.start_date,
  c.end_date,
  c.min_live_days,
  c.target_contents,
  c.target_views,
  c.target_registrants,
  c.created_at
from public.campaigns c
where c.client_id = public.current_client_id()
  and c.status in ('aktif', 'selesai');

comment on view public.client_portal_campaigns is
  'FR-M14-03: the client''s own campaigns. Never exposes package_price, the fee scheme or margin.';

create view public.client_portal_contents
with (security_invoker = off) as
select
  ct.id,
  cc.campaign_id,
  cc.id as campaign_creator_id,
  ct.platform,
  ct.posted_url,
  ct.posted_at,
  ct.live_status,
  ct.removed_at,
  -- The client knows creators by their stage name only.
  nullif(cr.stage_name, '') as creator_name
from public.contents ct
join public.campaign_creators cc on cc.id = ct.campaign_creator_id
join public.creators cr on cr.id = cc.creator_id
where public.client_owns_campaign(cc.campaign_id)
  and ct.posted_at is not null
  and ct.live_status <> 'belum_tayang';

comment on view public.client_portal_contents is
  'FR-M14-03: content that actually went live, by stage name.';

create view public.client_portal_creators
with (security_invoker = off) as
select
  cc.id as campaign_creator_id,
  cc.campaign_id,
  nullif(cr.stage_name, '') as creator_name,
  cc.referral_code,
  (
    select count(*)
    from public.contents ct
    where ct.campaign_creator_id = cc.id and ct.posted_at is not null
  ) as live_contents,
  (
    select count(*)
    from public.link_clicks lc
    where lc.campaign_creator_id = cc.id
  ) as clicks_total,
  (
    select count(*)
    from public.link_clicks lc
    where lc.campaign_creator_id = cc.id and not lc.is_bot
  ) as clicks_human,
  (
    select coalesce(sum(rr.registrant_count), 0)
    from public.registrant_reports rr
    where rr.campaign_creator_id = cc.id
  ) as registrants
from public.campaign_creators cc
join public.creators cr on cr.id = cc.creator_id
where public.client_owns_campaign(cc.campaign_id);

comment on view public.client_portal_creators is
  'FR-M14-03: per-creator recap for the client, with the referral code they will report against.';

create view public.client_portal_metrics
with (security_invoker = off) as
select
  s.id,
  s.content_id,
  cc.campaign_id,
  s.checkpoint,
  s.captured_at,
  s.views,
  s.likes,
  s.comments,
  s.shares,
  s.saves
from public.metric_snapshots s
join public.contents ct on ct.id = s.content_id
join public.campaign_creators cc on cc.id = ct.campaign_creator_id
where public.client_owns_campaign(cc.campaign_id);

comment on view public.client_portal_metrics is
  'FR-M14-03: verified snapshots behind the client''s charts and totals.';

revoke all on public.client_portal_campaigns from anon;
revoke all on public.client_portal_contents from anon;
revoke all on public.client_portal_creators from anon;
revoke all on public.client_portal_metrics from anon;

grant select on public.client_portal_campaigns to authenticated;
grant select on public.client_portal_contents to authenticated;
grant select on public.client_portal_creators to authenticated;
grant select on public.client_portal_metrics to authenticated;
