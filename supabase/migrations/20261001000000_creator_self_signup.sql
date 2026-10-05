-- Phase 15 (v4.0): kliper self-registration (PRD M16, FR-M3-01..05, FR-M3-09).
--
-- 1. Roles come from the server only. `raw_user_meta_data` is whatever the
--    caller of `auth.signUp` sends (the anon key is public), so it can never
--    decide a role again. `raw_app_meta_data` is writable by the service role
--    only; an account without a role there is a creator, the least privileged
--    one. Invitations set the real role right after the invite (lib/auth/
--    invite-role.ts), so a failure there leaves a harmless creator account.
-- 2. A self-registration (`user_metadata.signup = 'mandiri'`) also creates the
--    creator row. Every field is validated here again, because a direct call
--    to the Auth API skips the /daftar form.
-- 3. Creators manage their own social accounts from the portal; verification
--    fields stay with the team.
-- 4. Local badge, blocking and account deletion requests.

-- ---------------------------------------------------------------------------
-- New creator columns
-- ---------------------------------------------------------------------------
create type public.signup_source as enum ('undangan', 'mandiri');

alter table public.creators
  add column signup_source public.signup_source not null default 'undangan',
  add column verification_code text,
  add column blocked_at timestamptz,
  add column blocked_reason text,
  add column deletion_requested_at timestamptz;

-- Same alphabet as lib/referral/generate.ts: no I/1 or O/0.
create or replace function public.generate_verification_code()
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
    code := 'KB-';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from public.creators c where c.verification_code = code);
  end loop;
  return code;
end;
$$;

-- A column default (not a trigger) keeps the generated Insert type optional.
-- Defaults run as the inserting user, so the team may execute the generator.
revoke execute on function public.generate_verification_code() from public, anon;
grant execute on function public.generate_verification_code() to authenticated;

update public.creators
set verification_code = public.generate_verification_code()
where verification_code is null;

alter table public.creators
  alter column verification_code set default public.generate_verification_code(),
  alter column verification_code set not null,
  add constraint creators_verification_code_key unique (verification_code),
  add constraint creators_verification_code_check check (verification_code ~ '^KB-[A-HJ-NP-Z2-9]{6}$');

-- Blocked creators carry a reason (FR-M3-09). Rows blocked before v4.0 get a
-- placeholder so the constraint can hold from now on.
update public.creators
set blocked_at = coalesce(blocked_at, updated_at),
    blocked_reason = coalesce(nullif(trim(blocked_reason), ''), 'Diblokir sebelum v4.0')
where status = 'diblokir';

alter table public.creators
  add constraint creators_blocked_reason_check check (
    status <> 'diblokir' or length(trim(coalesce(blocked_reason, ''))) > 0
  );

-- ---------------------------------------------------------------------------
-- WhatsApp numbers are unique across creators (FR-M16-06). Stored numbers are
-- already normalised by lib/validation/phone.ts; a duplicate stops the
-- migration with the offending number so the team can merge the rows first.
-- ---------------------------------------------------------------------------
do $$
declare
  duplicate text;
begin
  select phone_wa into duplicate
  from public.creators
  where phone_wa <> '' and anonymized_at is null
  group by phone_wa
  having count(*) > 1
  limit 1;

  if duplicate is not null then
    raise exception 'Duplicate creator WhatsApp number %: merge or clear the rows before migrating', duplicate;
  end if;
end;
$$;

create unique index creators_phone_wa_key
  on public.creators (phone_wa)
  where phone_wa <> '' and anonymized_at is null;

create index creators_signup_source_idx on public.creators (signup_source);

-- ---------------------------------------------------------------------------
-- 1 + 2. Profiles and self-registered creators
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  assigned_role public.user_role;
  birth date;
  new_creator_id uuid;
begin
  -- Never `raw_user_meta_data ->> 'role'`: see the header of this migration.
  assigned_role := coalesce(
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    'creator'
  );

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(meta ->> 'full_name', ''),
    assigned_role
  )
  on conflict (id) do update set email = excluded.email;

  if assigned_role = 'creator' and meta ->> 'signup' = 'mandiri' then
    begin
      birth := (meta ->> 'birth_date')::date;
    exception when others then
      raise exception 'SIGNUP_INVALID: birth_date';
    end;

    if length(trim(coalesce(meta ->> 'full_name', ''))) = 0
      or length(trim(coalesce(meta ->> 'stage_name', ''))) = 0
      or length(trim(coalesce(meta ->> 'city', ''))) = 0
      or length(trim(coalesce(meta ->> 'province', ''))) = 0
      or length(trim(coalesce(meta ->> 'terms_version', ''))) = 0
      or coalesce(meta ->> 'phone_wa', '') !~ '^628[0-9]{7,12}$'
      or birth is null
    then
      raise exception 'SIGNUP_INVALID: missing or malformed registration fields';
    end if;

    -- A taken number is refused with the same generic message as any other
    -- invalid field: the unique index would echo the number back to whoever
    -- calls the Auth API. The index still settles a race between two sign-ups.
    if exists (
      select 1 from public.creators c
      where c.phone_wa = meta ->> 'phone_wa' and c.anonymized_at is null
    ) then
      raise exception 'SIGNUP_INVALID: registration rejected';
    end if;

    -- creators_adult_check rejects anyone under 18 (FR-M3-02).
    insert into public.creators (
      full_name, stage_name, phone_wa, email, city, province, birth_date,
      status, signup_source, terms_version, terms_agreed_at, profile_id
    )
    values (
      trim(meta ->> 'full_name'),
      trim(meta ->> 'stage_name'),
      meta ->> 'phone_wa',
      coalesce(new.email, ''),
      trim(meta ->> 'city'),
      trim(meta ->> 'province'),
      birth,
      'prospek',
      'mandiri',
      left(trim(meta ->> 'terms_version'), 50),
      now(),
      new.id
    )
    returning id into new_creator_id;

    -- FR-M11-01: the registration is the kliper's own first action.
    insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
    values (
      new.id,
      'creator',
      new_creator_id,
      'self_signup',
      jsonb_build_object('terms_version', left(trim(meta ->> 'terms_version'), 50))
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Creators manage their own social accounts (FR-M3-03, FR-M16-05)
-- ---------------------------------------------------------------------------
alter table public.creator_social_accounts
  add column badge_requested_at timestamptz,
  add column badge_review_notes text;

create policy "creator_social_accounts_select_own"
  on public.creator_social_accounts for select to authenticated
  using (creator_id = public.current_creator_id());

create policy "creator_social_accounts_insert_own"
  on public.creator_social_accounts for insert to authenticated
  with check (creator_id = public.current_creator_id());

create policy "creator_social_accounts_update_own"
  on public.creator_social_accounts for update to authenticated
  using (creator_id = public.current_creator_id())
  with check (creator_id = public.current_creator_id());

create policy "creator_social_accounts_delete_own"
  on public.creator_social_accounts for delete to authenticated
  using (creator_id = public.current_creator_id());

-- The verification stamp and the review notes belong to the team. A creator
-- editing the audience claim of an account withdraws its verification.
create or replace function public.guard_portal_social_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.is_active_member() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.last_verified_at is not null or new.badge_review_notes is not null then
      raise exception 'PORTAL_FIELD_LOCKED: verification fields belong to the team';
    end if;
    return new;
  end if;

  if new.creator_id is distinct from old.creator_id
    or new.last_verified_at is distinct from old.last_verified_at
    or new.badge_review_notes is distinct from old.badge_review_notes
  then
    -- Withdrawing the stamp alongside a new audience claim is the one change
    -- the portal may make to last_verified_at.
    if not (
      new.creator_id = old.creator_id
      and new.last_verified_at is null
      and new.badge_review_notes is not distinct from old.badge_review_notes
    ) then
      raise exception 'PORTAL_FIELD_LOCKED: verification fields belong to the team';
    end if;
  end if;

  if new.kalimantan_audience_pct is distinct from old.kalimantan_audience_pct
    or new.audience_proof_path is distinct from old.audience_proof_path
    or new.top_cities is distinct from old.top_cities
  then
    new.last_verified_at := null;
  end if;

  return new;
end;
$$;

create trigger creator_social_accounts_guard_portal
  before insert or update on public.creator_social_accounts
  for each row
  execute function public.guard_portal_social_account();

-- The first social account turns a self-registered prospect into an active
-- kliper (FR-M16-05). Runs as definer: the creator cannot update `creators`.
create or replace function public.activate_self_registered_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.creators
  set status = 'aktif'
  where id = new.creator_id
    and status = 'prospek'
    and signup_source = 'mandiri';
  return new;
end;
$$;

create trigger creator_social_accounts_activate_creator
  after insert on public.creator_social_accounts
  for each row
  execute function public.activate_self_registered_creator();

-- Audience proofs: a creator reads and writes files under their own folder
-- only (`<creator_id>/...`, as lib/storage and the team already name them).
create policy "audience_proofs_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'audience-proofs'
    and (storage.foldername(name))[1] = public.current_creator_id()::text
  );

create policy "audience_proofs_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'audience-proofs'
    and (storage.foldername(name))[1] = public.current_creator_id()::text
  );

create policy "audience_proofs_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'audience-proofs'
    and (storage.foldername(name))[1] = public.current_creator_id()::text
  );

-- ---------------------------------------------------------------------------
-- 4. Local badge, blocking, deletion requests
-- ---------------------------------------------------------------------------

-- Unblocking is an owner decision (FR-M3-09); blocking stamps the time.
create or replace function public.guard_creator_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'diblokir' and old.status is distinct from 'diblokir' then
    new.blocked_at := now();
  elsif old.status = 'diblokir' and new.status <> 'diblokir' then
    if (select auth.uid()) is not null and not public.is_owner() then
      raise exception 'OWNER_ONLY: only an owner can unblock a creator';
    end if;
    new.blocked_at := null;
    new.blocked_reason := null;
  end if;
  return new;
end;
$$;

create trigger creators_guard_block
  before update of status on public.creators
  for each row
  execute function public.guard_creator_block();

-- FR-M16-09: the creator asks, the owner erases (anonymize_creator).
create or replace function public.request_creator_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_creator_id();
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no creator for this account';
  end if;
  update public.creators
  set deletion_requested_at = coalesce(deletion_requested_at, now())
  where id = me;
end;
$$;

revoke execute on function public.request_creator_account_deletion() from public, anon;
grant execute on function public.request_creator_account_deletion() to authenticated;

-- ---------------------------------------------------------------------------
-- Portal read surface
-- ---------------------------------------------------------------------------
-- New columns go last: `create or replace view` may only append.
create or replace view public.creator_portal_profile
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
  c.portal_invited_at,
  c.verification_code,
  c.verified_at as local_badge_at,
  c.signup_source,
  c.deletion_requested_at
from public.creators c
where c.id = public.current_creator_id();

create view public.creator_portal_social_accounts
with (security_invoker = off) as
select
  s.id,
  s.platform,
  s.handle,
  s.profile_url,
  s.followers_count,
  s.kalimantan_audience_pct,
  s.top_cities,
  s.audience_proof_path,
  s.last_verified_at,
  s.badge_requested_at,
  s.badge_review_notes,
  s.created_at
from public.creator_social_accounts s
where s.creator_id = public.current_creator_id();

comment on view public.creator_portal_social_accounts is
  'FR-M3-03, FR-M16-08: the signed-in creator''s own social accounts and badge requests.';

revoke all on public.creator_portal_social_accounts from anon;
grant select on public.creator_portal_social_accounts to authenticated;
