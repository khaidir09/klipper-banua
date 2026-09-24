-- Phase 18 (v4.0): balance, bank accounts and withdrawals (PRD M19,
-- FR-M3-06, FR-M3-08, FR-M3-09, FR-M8-06, FR-M11-01, FR-M12-01).
--
-- 1. The minimum withdrawal lives in `platform_settings` so the owner can
--    change it without a release (owner decision 24 Sep 2026: Rp 100.000,
--    i.e. 10.000 views at Rp 10.000 per 1.000).
-- 2. A klipper saves their own bank account through a function, so the full
--    number is never readable back from the portal (RLS would need SELECT).
-- 3. `request_withdrawal()` locks the klipper row and writes the withdrawal
--    and its ledger debit in one transaction, so a balance cannot be drawn
--    twice. The owner processes it with `process_withdrawal()`; a rejection
--    refunds the ledger. `adjust_balance()` is the owner's correction.
-- 4. The klipper bears the transfer fee (owner decision 24 Sep 2026): the
--    owner records the fee actually charged when marking a withdrawal paid,
--    and the klipper receives amount − fee. The ledger debit stays the full
--    amount, so the balance maths do not change.
-- 5. A blocked klipper keeps read access to their balance (FR-M3-09) through
--    `current_creator_account_id()`; every write path stays on
--    `current_creator_id()`, which still excludes blocked accounts.

-- ---------------------------------------------------------------------------
-- 1. Types, settings, columns
-- ---------------------------------------------------------------------------
create type public.withdrawal_status as enum ('diajukan', 'diproses', 'dibayar', 'ditolak');

-- FR-M12-01 (v4.0).
alter type public.ops_activity add value if not exists 'verifikasi_klip';
alter type public.ops_activity add value if not exists 'penarikan';

-- One row, enforced by the boolean primary key.
create table public.platform_settings (
  id boolean primary key default true,
  min_withdrawal bigint not null default 100000,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id),
  constraint platform_settings_min_withdrawal_check check (
    min_withdrawal between 10000 and 100000000
  )
);

comment on table public.platform_settings is
  'Platform-wide settings the owner changes from the app (one row). min_withdrawal: FR-M19-05.';

insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row
  execute function public.set_updated_at();

alter table public.platform_settings enable row level security;

create policy "platform_settings_select_active_members"
  on public.platform_settings for select to authenticated
  using (public.is_active_member());

create policy "platform_settings_update_owner"
  on public.platform_settings for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- Readable by everyone signed in (the portal shows the minimum).
create or replace function public.current_min_withdrawal()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select min_withdrawal from public.platform_settings where id), 100000);
$$;

revoke execute on function public.current_min_withdrawal() from public, anon;
grant execute on function public.current_min_withdrawal() to authenticated;

-- FR-M19-04: a change holds new withdrawals for 24 hours; a holder name that
-- differs from the klipper's full name is flagged for the owner.
alter table public.creator_bank_accounts
  add column changed_at timestamptz,
  add column holder_matches_name boolean not null default true;

comment on column public.creator_bank_accounts.changed_at is
  'Last change of bank, number or holder after the first save; withdrawals wait 24 hours after it (FR-M19-04).';

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

-- Same as current_creator_id(), but a blocked klipper is included: used by
-- the read-only balance views only (FR-M3-09).
create or replace function public.current_creator_account_id()
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
    and c.anonymized_at is null
  limit 1;
$$;

revoke execute on function public.current_creator_account_id() from anon;

-- Balance = Σ ledger (PRD 8.7). Mirrored by availableBalance() in
-- lib/calculations/balance.ts.
create or replace function public.creator_balance(target_creator_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.creator_ledger_entries
  where creator_id = target_creator_id;
$$;

revoke execute on function public.creator_balance(uuid) from public, anon, authenticated;

-- Case and spacing do not count as a different name.
create or replace function public.normalize_person_name(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(lower(trim(coalesce(value, ''))), '\s+', ' ', 'g');
$$;

create or replace function public.track_bank_account_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.holder_matches_name := public.normalize_person_name(new.account_holder) = (
    select public.normalize_person_name(c.full_name) from public.creators c where c.id = new.creator_id
  );

  -- Service role and seeds (no JWT) may set the stamp themselves.
  if (select auth.uid()) is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.changed_at := null;
  elsif new.bank_name is distinct from old.bank_name
    or new.account_number is distinct from old.account_number
    or new.account_holder is distinct from old.account_holder
  then
    new.changed_at := now();
  else
    new.changed_at := old.changed_at;
  end if;
  return new;
end;
$$;

create trigger creator_bank_accounts_track_change
  before insert or update on public.creator_bank_accounts
  for each row
  execute function public.track_bank_account_change();

-- ---------------------------------------------------------------------------
-- 3. Withdrawals
-- ---------------------------------------------------------------------------
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete restrict,
  amount bigint not null,
  -- Copy of the bank account at request time.
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  status public.withdrawal_status not null default 'diajukan',
  requested_at timestamptz not null default now(),
  processed_by uuid references public.profiles (id) on delete set null,
  processed_at timestamptz,
  paid_at date,
  transfer_proof_path text,
  -- Charged by the bank or e-wallet and borne by the klipper.
  transfer_fee bigint not null default 0,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint withdrawals_amount_check check (amount > 0),
  constraint withdrawals_transfer_fee_check check (transfer_fee >= 0 and transfer_fee < amount),
  -- FR-M19-06: paid needs the transfer date and proof; rejected needs a reason.
  constraint withdrawals_paid_check check (
    status <> 'dibayar'
    or (paid_at is not null and length(trim(coalesce(transfer_proof_path, ''))) > 0)
  ),
  constraint withdrawals_rejected_check check (
    status <> 'ditolak' or length(trim(coalesce(rejection_reason, ''))) > 0
  )
);

comment on table public.withdrawals is
  'FR-M19-05, FR-M19-06: balance withdrawals. Owner only; the klipper reads a masked copy through creator_portal_withdrawals.';

create index withdrawals_creator_idx on public.withdrawals (creator_id, requested_at);
create index withdrawals_status_idx on public.withdrawals (status, requested_at);

-- FR-M19-05: one open withdrawal per klipper.
create unique index withdrawals_one_open_idx
  on public.withdrawals (creator_id)
  where status in ('diajukan', 'diproses');

create trigger withdrawals_set_updated_at
  before update on public.withdrawals
  for each row
  execute function public.set_updated_at();

-- Only the functions below change a withdrawal.
create or replace function public.guard_withdrawal_change()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.withdrawal_write', true), '') <> 'on' then
    raise exception 'WITHDRAWAL_FUNCTION_ONLY: withdrawals change through request_withdrawal and process_withdrawal';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'WITHDRAWAL_IMMUTABLE: withdrawals stay on record';
  end if;
  return new;
end;
$$;

create trigger withdrawals_guard
  before insert or update or delete on public.withdrawals
  for each row
  execute function public.guard_withdrawal_change();

alter table public.withdrawals enable row level security;

-- RLS on the base table: owner only (PRD 7.2). Writes go through functions.
create policy "withdrawals_select_owner"
  on public.withdrawals for select to authenticated
  using (public.is_owner());

alter table public.creator_ledger_entries
  add constraint creator_ledger_entries_withdrawal_id_fkey
    foreign key (withdrawal_id) references public.withdrawals (id) on delete restrict,
  add constraint creator_ledger_entries_withdrawal_ref_check check (
    entry_type not in ('penarikan', 'pengembalian_penarikan') or withdrawal_id is not null
  ),
  add constraint creator_ledger_entries_adjustment_notes_check check (
    entry_type <> 'penyesuaian' or length(trim(notes)) > 0
  );

-- ---------------------------------------------------------------------------
-- 4. The klipper's bank account (FR-M19-04)
-- ---------------------------------------------------------------------------
create or replace function public.save_creator_bank_account(
  p_bank_name text,
  p_account_number text,
  p_account_holder text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.current_creator_id();
  v_existing public.creator_bank_accounts%rowtype;
  v_saved public.creator_bank_accounts%rowtype;
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no active klipper for this account';
  end if;
  if length(trim(coalesce(p_bank_name, ''))) = 0 or length(trim(coalesce(p_account_holder, ''))) = 0 then
    raise exception 'BANK_ACCOUNT_INCOMPLETE: bank and holder name are required';
  end if;

  select * into v_existing from public.creator_bank_accounts where creator_id = me;

  insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder)
  values (me, trim(p_bank_name), regexp_replace(p_account_number, '[\s-]', '', 'g'), trim(p_account_holder))
  on conflict (creator_id) do update
    set bank_name = excluded.bank_name,
        account_number = excluded.account_number,
        account_holder = excluded.account_holder
  returning * into v_saved;

  -- FR-M11-01: the change is logged; never the number itself.
  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'creator_bank_account', me,
    case when v_existing.id is null then 'create' else 'update' end,
    jsonb_build_object(
      'bank_name', v_saved.bank_name,
      'last4', right(v_saved.account_number, 4),
      'holder_matches_name', v_saved.holder_matches_name,
      'from_portal', true
    )
  );
end;
$$;

revoke execute on function public.save_creator_bank_account(text, text, text) from public, anon;
grant execute on function public.save_creator_bank_account(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Requesting a withdrawal (FR-M19-05, PRD 8.7). Mirrored by
--    withdrawalBlockers() in lib/calculations/balance.ts.
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
      raise exception 'WITHDRAW_CREATOR_BLOCKED: a blocked klipper cannot withdraw';
    end if;
    raise exception 'CREATOR_NOT_FOUND: no active klipper for this account';
  end if;

  -- Serialises every withdrawal of this klipper (two requests at once).
  select * into v_creator from public.creators where id = me for update;
  if v_creator.status = 'diblokir' then
    raise exception 'WITHDRAW_CREATOR_BLOCKED: a blocked klipper cannot withdraw';
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

revoke execute on function public.request_withdrawal(bigint) from public, anon;
grant execute on function public.request_withdrawal(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Processing (FR-M19-06, owner only)
-- ---------------------------------------------------------------------------
create or replace function public.process_withdrawal(
  p_id uuid,
  p_status public.withdrawal_status,
  p_paid_at date default null,
  p_proof_path text default null,
  p_reason text default null,
  p_transfer_fee bigint default 0
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.withdrawals%rowtype;
begin
  if not public.is_owner() then
    raise exception 'OWNER_ONLY: only an owner processes withdrawals';
  end if;

  select * into v_row from public.withdrawals where id = p_id for update;
  if not found then
    raise exception 'WITHDRAWAL_NOT_FOUND: withdrawal % does not exist', p_id;
  end if;

  if not (
    (v_row.status = 'diajukan' and p_status in ('diproses', 'ditolak'))
    or (v_row.status = 'diproses' and p_status in ('dibayar', 'ditolak'))
  ) then
    raise exception 'INVALID_WITHDRAWAL_TRANSITION: % -> % is not allowed', v_row.status, p_status;
  end if;

  if p_status = 'dibayar' and (p_paid_at is null or length(trim(coalesce(p_proof_path, ''))) = 0) then
    raise exception 'WITHDRAWAL_PAID_NEEDS_PROOF: enter the transfer date and upload the proof';
  end if;
  if p_status = 'dibayar'
    and (coalesce(p_transfer_fee, 0) < 0 or coalesce(p_transfer_fee, 0) >= v_row.amount)
  then
    raise exception 'WITHDRAWAL_FEE_INVALID: the transfer fee must be below the amount';
  end if;
  if p_status = 'ditolak' and length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'WITHDRAWAL_REJECT_NEEDS_REASON: tell the klipper why';
  end if;

  perform set_config('app.withdrawal_write', 'on', true);
  update public.withdrawals
    set status = p_status,
        processed_by = (select auth.uid()),
        processed_at = now(),
        paid_at = case when p_status = 'dibayar' then p_paid_at else paid_at end,
        transfer_fee = case when p_status = 'dibayar' then coalesce(p_transfer_fee, 0) else transfer_fee end,
        transfer_proof_path = case when p_status = 'dibayar' then trim(p_proof_path) else transfer_proof_path end,
        rejection_reason = case when p_status = 'ditolak' then trim(p_reason) else rejection_reason end
    where id = p_id;
  perform set_config('app.withdrawal_write', 'off', true);

  if p_status = 'ditolak' then
    perform set_config('app.ledger_write', 'on', true);
    insert into public.creator_ledger_entries (creator_id, entry_type, amount, withdrawal_id, notes, created_by)
    values (v_row.creator_id, 'pengembalian_penarikan', v_row.amount, p_id, trim(p_reason), (select auth.uid()));
    perform set_config('app.ledger_write', 'off', true);
  end if;

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'withdrawal', p_id, 'withdrawal_' || p_status::text,
    jsonb_build_object(
      'creator_id', v_row.creator_id, 'amount', v_row.amount,
      'paid_at', p_paid_at, 'reason', nullif(trim(coalesce(p_reason, '')), ''),
      'transfer_fee', case when p_status = 'dibayar' then coalesce(p_transfer_fee, 0) end
    )
  );
end;
$$;

revoke execute on function public.process_withdrawal(uuid, public.withdrawal_status, date, text, text, bigint) from public, anon;
grant execute on function public.process_withdrawal(uuid, public.withdrawal_status, date, text, text, bigint) to authenticated;

-- Owner's correction (FR-M19-01, FR-M19-06), e.g. paying out or cancelling
-- the frozen balance of a blocked klipper (FR-M3-09).
create or replace function public.adjust_balance(
  p_creator_id uuid,
  p_amount bigint,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_owner() then
    raise exception 'OWNER_ONLY: only an owner adjusts a balance';
  end if;
  if p_amount is null or p_amount = 0 then
    raise exception 'ADJUSTMENT_INVALID: the amount cannot be zero';
  end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'ADJUSTMENT_NEEDS_REASON: an adjustment needs a reason';
  end if;

  perform 1 from public.creators where id = p_creator_id for update;
  if not found then
    raise exception 'CREATOR_NOT_FOUND: creator % does not exist', p_creator_id;
  end if;

  perform set_config('app.ledger_write', 'on', true);
  insert into public.creator_ledger_entries (creator_id, entry_type, amount, notes, created_by)
  values (p_creator_id, 'penyesuaian', p_amount, trim(p_reason), (select auth.uid()))
  returning id into v_id;
  perform set_config('app.ledger_write', 'off', true);

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'creator_ledger_entry', v_id, 'ledger_adjust',
    jsonb_build_object('creator_id', p_creator_id, 'amount', p_amount, 'reason', trim(p_reason))
  );
  return v_id;
end;
$$;

revoke execute on function public.adjust_balance(uuid, bigint, text) from public, anon;
grant execute on function public.adjust_balance(uuid, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Portal read surface (PRD 7.3). Filtered on current_creator_account_id(),
--    so a blocked klipper still reads their balance; whitelisted columns;
--    never readable by `anon`.
-- ---------------------------------------------------------------------------
create view public.creator_portal_account
with (security_invoker = off) as
select
  c.id,
  c.full_name,
  c.stage_name,
  c.status,
  c.blocked_at,
  c.blocked_reason
from public.creators c
where c.id = public.current_creator_account_id();

comment on view public.creator_portal_account is
  'FR-M3-09: who the signed-in klipper is, including a blocked one, and why they were blocked.';

create view public.creator_portal_ledger
with (security_invoker = off) as
select
  e.id,
  e.entry_type,
  e.amount,
  e.campaign_id,
  cp.name as campaign_name,
  e.content_id,
  e.withdrawal_id,
  e.notes,
  e.created_at
from public.creator_ledger_entries e
left join public.campaigns cp on cp.id = e.campaign_id
where e.creator_id = public.current_creator_account_id();

comment on view public.creator_portal_ledger is
  'FR-M19-03: the klipper''s own ledger entries.';

-- Mirrored by balanceSummary() in lib/calculations/balance.ts.
create view public.creator_portal_balance
with (security_invoker = off) as
select
  me.id as creator_id,
  coalesce(sum(e.amount), 0)::bigint as available,
  coalesce(sum(e.amount) filter (
    where e.entry_type in ('honor_klip', 'pembatalan', 'penyesuaian')
  ), 0)::bigint as total_earned,
  coalesce(-sum(e.amount) filter (
    where e.entry_type in ('penarikan', 'pengembalian_penarikan')
  ), 0)::bigint as total_withdrawn,
  public.current_min_withdrawal() as min_withdrawal
from (select public.current_creator_account_id() as id) me
left join public.creator_ledger_entries e on e.creator_id = me.id
where me.id is not null
group by me.id;

comment on view public.creator_portal_balance is
  'FR-M19-03: available balance, total earned, total withdrawn (incl. in progress) and the current minimum withdrawal.';

create view public.creator_portal_withdrawals
with (security_invoker = off) as
select
  w.id,
  w.amount,
  w.bank_name,
  repeat('*', greatest(length(w.account_number) - 4, 0)) || right(w.account_number, 4) as account_number_masked,
  w.account_holder,
  w.status,
  w.requested_at,
  w.processed_at,
  w.paid_at,
  w.rejection_reason,
  w.transfer_fee,
  -- What reached the klipper's account once paid.
  w.amount - w.transfer_fee as net_amount
from public.withdrawals w
where w.creator_id = public.current_creator_account_id();

comment on view public.creator_portal_withdrawals is
  'FR-M19-07: the klipper''s withdrawals, account number masked, without the transfer proof.';

create view public.creator_portal_bank_account
with (security_invoker = off) as
select
  b.bank_name,
  repeat('*', greatest(length(b.account_number) - 4, 0)) || right(b.account_number, 4) as account_number_masked,
  b.account_holder,
  b.holder_matches_name,
  b.changed_at,
  case when b.changed_at is null then null else b.changed_at + interval '24 hours' end as hold_until,
  b.updated_at
from public.creator_bank_accounts b
where b.creator_id = public.current_creator_account_id();

comment on view public.creator_portal_bank_account is
  'FR-M19-04: the klipper''s own bank account, number masked.';

revoke all on public.creator_portal_account from anon;
revoke all on public.creator_portal_ledger from anon;
revoke all on public.creator_portal_balance from anon;
revoke all on public.creator_portal_withdrawals from anon;
revoke all on public.creator_portal_bank_account from anon;
grant select on public.creator_portal_account to authenticated;
grant select on public.creator_portal_ledger to authenticated;
grant select on public.creator_portal_balance to authenticated;
grant select on public.creator_portal_withdrawals to authenticated;
grant select on public.creator_portal_bank_account to authenticated;

-- The masked view for managers also shows whether the holder name matches.
drop function if exists public.get_masked_bank_account(uuid);
create function public.get_masked_bank_account(p_creator_id uuid)
returns table (bank_name text, account_number_masked text, holder_matches_name boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.bank_name,
    repeat('*', greatest(length(b.account_number) - 4, 0)) || right(b.account_number, 4),
    b.holder_matches_name
  from public.creator_bank_accounts b
  where b.creator_id = p_creator_id
    and public.is_active_member();
$$;

revoke execute on function public.get_masked_bank_account(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 8. FR-M16-09: an account is anonymized only with a zero balance and no
--    withdrawal in progress (enforceable now that the ledger exists).
-- ---------------------------------------------------------------------------
create or replace function public.guard_creator_anonymize_balance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.anonymized_at is null and new.anonymized_at is not null then
    if public.creator_balance(new.id) <> 0 then
      raise exception 'ANONYMIZE_BALANCE_NOT_ZERO: settle the balance before deleting the account';
    end if;
    if exists (
      select 1 from public.withdrawals
      where creator_id = new.id and status in ('diajukan', 'diproses')
    ) then
      raise exception 'ANONYMIZE_WITHDRAWAL_OPEN: finish the withdrawal before deleting the account';
    end if;
  end if;
  return new;
end;
$$;

create trigger creators_guard_anonymize_balance
  before update of anonymized_at on public.creators
  for each row
  execute function public.guard_creator_anonymize_balance();

-- ---------------------------------------------------------------------------
-- 9. Clip period starts at the minute the klipper joined. The posting time
--    comes from a minute-precision input, so a clip posted in the same
--    minute as joining was refused as "before joining" (fix to Phase 17).
--    Mirrored by clipPeriod() in lib/campaigns/clips.ts.
-- ---------------------------------------------------------------------------
create or replace function public.guard_clip_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment public.campaign_creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_creator public.creators%rowtype;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  select * into v_assignment from public.campaign_creators where id = new.campaign_creator_id;
  select * into v_campaign from public.campaigns where id = v_assignment.campaign_id;

  if v_campaign.payout_model is distinct from 'per_views' then
    return new;
  end if;

  new.posted_url_normalized := public.normalize_clip_url(coalesce(new.posted_url, new.proposed_posted_url));

  -- Service role, seeds and the verification functions below pass through.
  if (select auth.uid()) is null
    or coalesce(current_setting('app.clip_write', true), '') = 'on'
  then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- The team decides through verify_clip / cancel_clip, which also keep the
    -- ledger right; a direct edit of these columns would bypass it.
    if new.posted_url is distinct from old.posted_url
      or new.posted_at is distinct from old.posted_at
      or new.live_status is distinct from old.live_status
      or new.removed_at is distinct from old.removed_at
      or new.verified_views is distinct from old.verified_views
      or new.rejection_reason is distinct from old.rejection_reason
      or new.caption_code_checked is distinct from old.caption_code_checked
      or new.proposed_posted_url is distinct from old.proposed_posted_url
      or new.proposed_posted_at is distinct from old.proposed_posted_at
      or new.platform is distinct from old.platform
    then
      raise exception 'CLIP_USE_VERIFY: clips change through the verification page';
    end if;
    return new;
  end if;

  -- INSERT: a new clip, checked in the order the portal explains them
  -- (lib/campaigns/clips.ts clipSubmissionBlockers).
  if new.proposed_posted_url is null or new.proposed_posted_at is null then
    raise exception 'CLIP_NEEDS_URL: a clip is sent with its live URL and time';
  end if;

  select * into v_creator from public.creators where id = v_assignment.creator_id;

  if v_creator.status not in ('aktif', 'terverifikasi') then
    raise exception 'CLIP_CREATOR_NOT_ACTIVE: the klipper account is not active';
  end if;
  if v_creator.terms_version is distinct from public.current_creator_terms_version() then
    raise exception 'CLIP_TERMS_OUTDATED: accept the latest terms first';
  end if;
  if v_assignment.status <> 'bergabung' then
    raise exception 'CLIP_ASSIGNMENT_NOT_JOINED: clips are sent for a joined assignment only';
  end if;
  if v_campaign.status <> 'aktif' or v_campaign.end_date < public.campaign_today() then
    raise exception 'CLIP_CAMPAIGN_CLOSED: the campaign no longer accepts clips';
  end if;
  if public.campaign_budget_exhausted(v_campaign.id) then
    raise exception 'CLIP_BUDGET_EXHAUSTED: the campaign budget is used up';
  end if;
  if not (new.platform = any (v_campaign.allowed_platforms)) then
    raise exception 'CLIP_PLATFORM_NOT_ALLOWED: the campaign does not accept this platform';
  end if;
  if not exists (
    select 1 from public.creator_social_accounts s
    where s.creator_id = v_creator.id and s.platform = new.platform
  ) then
    raise exception 'CLIP_NO_SOCIAL_ACCOUNT: register a social account on this platform first';
  end if;

  -- Mirrors clipPeriod() in lib/campaigns/clips.ts.
  v_period_start := greatest(
    coalesce(date_trunc('minute', v_assignment.joined_at), '-infinity'::timestamptz),
    (v_campaign.start_date::timestamp at time zone 'Asia/Makassar')
  );
  v_period_end := ((v_campaign.end_date + 1)::timestamp at time zone 'Asia/Makassar');

  if new.proposed_posted_at > now() + interval '5 minutes' then
    raise exception 'CLIP_POSTED_IN_FUTURE: the posting time is in the future';
  end if;
  if new.proposed_posted_at < v_period_start or new.proposed_posted_at >= v_period_end then
    raise exception 'CLIP_OUTSIDE_PERIOD: the clip was posted outside the campaign period';
  end if;

  -- Serialises clip counting per assignment.
  perform 1 from public.campaign_creators where id = v_assignment.id for update;
  if (
    select count(*) from public.contents ct
    where ct.campaign_creator_id = v_assignment.id and ct.review_status <> 'ditolak'
  ) >= v_campaign.max_clips_per_creator then
    raise exception 'CLIP_LIMIT_REACHED: the klipper already sent the maximum number of clips';
  end if;

  if exists (
    select 1
    from public.contents ct
    join public.campaign_creators cc on cc.id = ct.campaign_creator_id
    where cc.creator_id = v_creator.id
      and ct.review_status = 'ditolak'
      and ct.posted_url_normalized = new.posted_url_normalized
  ) then
    raise exception 'CLIP_URL_REJECTED_BEFORE: this clip was rejected before';
  end if;

  new.verified_views := null;
  new.rejection_reason := null;
  new.caption_code_checked := false;
  new.draft_url := null;
  new.draft_file_path := null;
  new.proposed_at := now();
  return new;
end;
$$;
