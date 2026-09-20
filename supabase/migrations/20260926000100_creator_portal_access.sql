-- Phase 9 (v2.0): creator portal access (PRD M13: FR-M13-01..04, FR-M13-08).
--
-- A creator signs in with the `creator` role and reaches /portal only. They
-- get no policy on any base table: `campaigns` carries the package price and
-- `creators` carries internal notes, and RLS filters rows, not columns.
-- Every portal read goes through the `creator_portal_*` views at the bottom
-- of this file, which run as the view owner, filter on the signed-in creator
-- and select whitelisted columns only.

-- ---------------------------------------------------------------------------
-- 1. `is_active_member()` now means "active INTERNAL member".
--    87 existing policies call it, so this one redefinition keeps the creator
--    role out of every table written before v2.0.
-- ---------------------------------------------------------------------------
create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select is_active and role in ('owner', 'manager')
      from public.profiles
      where id = (select auth.uid())
    ),
    false
  );
$$;

comment on function public.is_active_member() is
  'True only for an active owner or manager. The creator portal role never passes this check (PRD M13).';

-- ---------------------------------------------------------------------------
-- 2. Link a creator to their portal account.
-- ---------------------------------------------------------------------------
alter table public.creators
  add column profile_id uuid unique references public.profiles (id) on delete set null,
  add column portal_invited_at timestamptz;

comment on column public.creators.profile_id is
  'Portal account (profiles.role = creator), set when the invitation is sent (FR-M13-01).';
comment on column public.creators.portal_invited_at is
  'When the latest portal invitation was sent.';

-- ---------------------------------------------------------------------------
-- 3. Helpers. `security definer` so policies and views do not recurse into
--    profiles, and so a creator cannot read the tables they query.
-- ---------------------------------------------------------------------------

-- The creator behind the current session, or null for anyone else. Blocked
-- and anonymized creators lose portal access even if the account is active.
create or replace function public.current_creator_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.creators c
  join public.profiles p on p.id = c.profile_id
  where p.id = (select auth.uid())
    and p.is_active
    and p.role = 'creator'
    and c.status <> 'diblokir'
    and c.anonymized_at is null
  limit 1;
$$;

-- True when the signed-in creator is assigned to this campaign and the
-- campaign has left the draft stage. Drafts and cancelled campaigns stay
-- invisible to creators.
create or replace function public.creator_assigned_to_campaign(target_campaign_id uuid)
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
    where cc.campaign_id = target_campaign_id
      and cc.creator_id = public.current_creator_id()
      and c.status in ('aktif', 'selesai')
  );
$$;

revoke execute on function public.current_creator_id() from anon;
revoke execute on function public.creator_assigned_to_campaign(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 4. Portal access is granted and withdrawn by the team only.
-- ---------------------------------------------------------------------------
create or replace function public.protect_creator_portal_link()
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

create trigger creators_protect_portal_link
  before update on public.creators
  for each row
  execute function public.protect_creator_portal_link();

-- ---------------------------------------------------------------------------
-- 5. Erasing a creator's data also removes their portal account (UU PDP).
--    The link is cleared first, so the cascade from auth.users does not try
--    to update an already anonymized creator row.
-- ---------------------------------------------------------------------------
create or replace function public.anonymize_creator(target_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  proof_paths text[];
  label text;
  portal_profile_id uuid;
begin
  if not public.is_owner() then
    raise exception 'OWNER_ONLY: only an owner can anonymize a creator';
  end if;

  if not exists (select 1 from public.creators where id = target_id) then
    raise exception 'CREATOR_NOT_FOUND: creator does not exist';
  end if;

  if exists (select 1 from public.creators where id = target_id and anonymized_at is not null) then
    raise exception 'CREATOR_ANONYMIZED: this creator''s data was erased';
  end if;

  select coalesce(array_agg(audience_proof_path), '{}')
    into proof_paths
    from public.creator_social_accounts
    where creator_id = target_id and audience_proof_path is not null;

  select profile_id into portal_profile_id from public.creators where id = target_id;

  delete from public.creator_social_accounts where creator_id = target_id;
  delete from public.creator_bank_accounts where creator_id = target_id;

  label := 'Kreator anonim ' || upper(right(replace(target_id::text, '-', ''), 6));

  update public.creators
    set full_name = label,
        stage_name = '',
        phone_wa = '',
        email = '',
        city = '',
        birth_date = null,
        notes = '',
        status = 'diblokir',
        profile_id = null,
        portal_invited_at = null,
        anonymized_at = now()
    where id = target_id;

  -- The portal account holds the creator's email: it goes with the rest.
  if portal_profile_id is not null then
    delete from auth.users where id = portal_profile_id;
  end if;

  update public.activity_logs
    set details = details - 'full_name' - 'stage_name' - 'phone_wa' - 'email'
    where entity_type = 'creator' and entity_id = target_id;

  return proof_paths;
end;
$$;

revoke execute on function public.anonymize_creator(uuid) from public, anon;
grant execute on function public.anonymize_creator(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. The three policies a creator does get.
-- ---------------------------------------------------------------------------

-- Own display name and timezone (the privilege trigger still blocks role and
-- is_active). `profiles_select_own` already covers reading it back.
create policy "profiles_update_own_portal_creator"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and public.current_creator_id() is not null)
  with check (id = (select auth.uid()));

-- Portal actions stay in the audit trail (FR-M11-01). Reading it remains
-- owner-only.
create policy "activity_logs_insert_portal_creator"
  on public.activity_logs for insert to authenticated
  with check (
    public.current_creator_id() is not null
    and actor_id = (select auth.uid())
  );

-- Campaign material for the campaigns they are assigned to. Paths are
-- `<campaign_id>/<file>` (see lib/storage/upload.ts); the shape is checked
-- before the cast so a stray object cannot error the policy out.
create policy "campaign_assets_objects_select_portal_creator"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'campaign-assets'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.creator_assigned_to_campaign(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 7. The portal's read surface. `security_invoker = off` (the default, set
--    explicitly): the view runs as its owner, which owns the base tables, so
--    the WHERE clauses below - not RLS - decide what a creator sees.
-- ---------------------------------------------------------------------------

create view public.creator_portal_profile
with (security_invoker = off) as
select
  c.id,
  c.full_name,
  c.stage_name,
  c.phone_wa,
  c.email,
  c.city,
  c.province,
  c.tier,
  c.status,
  c.terms_version,
  c.terms_agreed_at,
  c.portal_invited_at
from public.creators c
where c.id = public.current_creator_id();

comment on view public.creator_portal_profile is
  'FR-M13-02: the signed-in creator''s own record, without internal notes.';

create view public.creator_portal_assignments
with (security_invoker = off) as
select
  cc.id,
  cc.campaign_id,
  cc.status,
  cc.contents_committed,
  cc.referral_code,
  cc.tracking_slug,
  cc.joined_at,
  -- Effective fee scheme, mirroring lib/calculations/fee-scheme.ts (PRD 8.1).
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
  cl.name as client_name
from public.campaign_creators cc
join public.campaigns cp on cp.id = cc.campaign_id
join public.clients cl on cl.id = cp.client_id
where cc.creator_id = public.current_creator_id()
  and cp.status in ('aktif', 'selesai');

comment on view public.creator_portal_assignments is
  'FR-M13-03, FR-M13-04: the creator''s own assignments and briefs. Never exposes package_price, targets or margin.';

create view public.creator_portal_assets
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
where public.creator_assigned_to_campaign(a.campaign_id);

comment on view public.creator_portal_assets is
  'FR-M13-04: campaign material for the campaigns this creator is assigned to.';

revoke all on public.creator_portal_profile from anon;
revoke all on public.creator_portal_assignments from anon;
revoke all on public.creator_portal_assets from anon;

grant select on public.creator_portal_profile to authenticated;
grant select on public.creator_portal_assignments to authenticated;
grant select on public.creator_portal_assets to authenticated;
