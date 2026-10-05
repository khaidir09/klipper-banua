-- FR-M3-02 (revised, PRD 1.5): age is no longer a requirement to be a kliper.
--
-- 1. The 18+ constraint goes, and `birth_date` may stay empty on any row.
-- 2. Self sign-up (`handle_new_user`) no longer asks for a birth date.
-- 3. `set_own_birth_date()` lets a kliper fill it in once from the portal;
--    later changes go through the team.
-- 4. `request_withdrawal()` refuses until the birth date is filled in
--    (FR-M19-05). Mirrored by withdrawalBlockers() in lib/calculations/balance.ts.
-- 5. `creator_portal_profile` exposes the kliper's own birth date.

-- ---------------------------------------------------------------------------
-- 1. Constraints
-- ---------------------------------------------------------------------------
alter table public.creators drop constraint creators_adult_check;
alter table public.creators drop constraint creators_birth_date_check;

-- A birth date, when given, is a real past date.
alter table public.creators add constraint creators_birth_date_range_check
  check (birth_date is null or birth_date between date '1900-01-01' and current_date);

-- ---------------------------------------------------------------------------
-- 2. Self sign-up without a birth date
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
  new_creator_id uuid;
begin
  -- Never `raw_user_meta_data ->> 'role'`: see 20261001000000_creator_self_signup.sql.
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
    if length(trim(coalesce(meta ->> 'full_name', ''))) = 0
      or length(trim(coalesce(meta ->> 'stage_name', ''))) = 0
      or length(trim(coalesce(meta ->> 'city', ''))) = 0
      or length(trim(coalesce(meta ->> 'province', ''))) = 0
      or length(trim(coalesce(meta ->> 'terms_version', ''))) = 0
      or coalesce(meta ->> 'phone_wa', '') !~ '^628[0-9]{7,12}$'
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

    -- FR-M3-02: no birth date at sign-up; it is asked before the first withdrawal.
    insert into public.creators (
      full_name, stage_name, phone_wa, email, city, province,
      status, signup_source, terms_version, terms_agreed_at, profile_id
    )
    values (
      trim(meta ->> 'full_name'),
      trim(meta ->> 'stage_name'),
      meta ->> 'phone_wa',
      coalesce(new.email, ''),
      trim(meta ->> 'city'),
      trim(meta ->> 'province'),
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
-- 3. The kliper fills in their own birth date, once
-- ---------------------------------------------------------------------------
create or replace function public.set_own_birth_date(p_birth_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_creator_id();
  v_creator public.creators%rowtype;
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no active kliper for this account';
  end if;

  select * into v_creator from public.creators where id = me for update;
  if v_creator.birth_date is not null then
    raise exception 'BIRTH_DATE_ALREADY_SET: ask the team to change the birth date';
  end if;
  if p_birth_date is null
    or p_birth_date < date '1900-01-01'
    or p_birth_date > current_date
  then
    raise exception 'BIRTH_DATE_INVALID: the birth date is not a valid past date';
  end if;

  update public.creators set birth_date = p_birth_date where id = me;

  -- The date itself stays out of the log (UU PDP).
  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values ((select auth.uid()), 'creator', me, 'birth_date_set', jsonb_build_object('from_portal', true));
end;
$$;

revoke execute on function public.set_own_birth_date(date) from public, anon;
grant execute on function public.set_own_birth_date(date) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Requesting a withdrawal needs a birth date (FR-M19-05)
-- ---------------------------------------------------------------------------
create or replace function public.request_withdrawal(p_amount bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_creator_id();
  v_creator public.creators%rowtype;
  v_bank public.creator_bank_accounts%rowtype;
  v_balance bigint;
  v_id uuid;
begin
  if me is null then
    if public.current_creator_account_id() is not null then
      raise exception 'WITHDRAW_CREATOR_BLOCKED: a blocked kliper cannot withdraw';
    end if;
    raise exception 'CREATOR_NOT_FOUND: no active kliper for this account';
  end if;

  -- Serialises every withdrawal of this kliper (two requests at once).
  select * into v_creator from public.creators where id = me for update;
  if v_creator.status = 'diblokir' then
    raise exception 'WITHDRAW_CREATOR_BLOCKED: a blocked kliper cannot withdraw';
  end if;
  if v_creator.birth_date is null then
    raise exception 'WITHDRAW_NEEDS_BIRTH_DATE: fill in the birth date first';
  end if;

  select * into v_bank from public.creator_bank_accounts where creator_id = me;
  if v_bank.id is null then
    raise exception 'WITHDRAW_NEEDS_BANK: add a bank account first';
  end if;
  if v_bank.changed_at is not null and v_bank.changed_at > now() - interval '24 hours' then
    raise exception 'WITHDRAW_BANK_RECENT: the bank account changed less than 24 hours ago';
  end if;
  if exists (
    select 1 from public.withdrawals
    where creator_id = me and status in ('diajukan', 'diproses')
  ) then
    raise exception 'WITHDRAW_PENDING_EXISTS: a withdrawal is already in progress';
  end if;
  if p_amount is null or p_amount < public.current_min_withdrawal() then
    raise exception 'WITHDRAW_BELOW_MIN: the amount is below the minimum withdrawal';
  end if;

  v_balance := public.creator_balance(me);
  if p_amount > v_balance then
    raise exception 'WITHDRAW_ABOVE_BALANCE: the amount exceeds the available balance';
  end if;

  perform set_config('app.withdrawal_write', 'on', true);
  insert into public.withdrawals (creator_id, amount, bank_name, account_number, account_holder)
  values (me, p_amount, v_bank.bank_name, v_bank.account_number, v_bank.account_holder)
  returning id into v_id;
  perform set_config('app.withdrawal_write', 'off', true);

  perform set_config('app.ledger_write', 'on', true);
  insert into public.creator_ledger_entries (creator_id, entry_type, amount, withdrawal_id, created_by)
  values (me, 'penarikan', -p_amount, v_id, (select auth.uid()));
  perform set_config('app.ledger_write', 'off', true);

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'withdrawal', v_id, 'withdrawal_request',
    jsonb_build_object('creator_id', me, 'amount', p_amount, 'balance_before', v_balance)
  );

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Portal read surface. New columns go last: `create or replace view` may
--    only append.
-- ---------------------------------------------------------------------------
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
  c.deletion_requested_at,
  c.birth_date
from public.creators c
where c.id = public.current_creator_id();
