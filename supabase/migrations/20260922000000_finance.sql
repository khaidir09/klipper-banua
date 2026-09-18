-- Phase 5: creator payouts and client payments (PRD M8, sections 7 and 8.3).

create type public.payout_status as enum ('draf', 'disetujui', 'dibayar');

create type public.client_payment_status as enum ('belum_dibayar', 'sebagian', 'lunas');

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  campaign_creator_id uuid not null unique references public.campaign_creators (id) on delete restrict,
  -- Whole Rupiah (PRD 7). Computed by lib/calculations/payout.ts.
  base_amount bigint not null default 0,
  views_bonus bigint not null default 0,
  registrant_bonus bigint not null default 0,
  adjustment_amount bigint not null default 0,
  adjustment_reason text not null default '',
  total_amount bigint not null default 0,
  -- Inputs of the calculation, kept for audit (PRD 7).
  calculation_snapshot jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  status public.payout_status not null default 'draf',
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  -- Calendar date of the bank transfer.
  paid_at date,
  transfer_proof_path text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payouts_amounts_check check (
    base_amount >= 0 and views_bonus >= 0 and registrant_bonus >= 0 and total_amount >= 0
  ),
  -- FR-M8-02: every adjustment explains itself.
  constraint payouts_adjustment_reason_check check (
    adjustment_amount = 0 or length(trim(adjustment_reason)) > 0
  ),
  constraint payouts_approval_check check (
    status = 'draf' or (approved_by is not null and approved_at is not null)
  ),
  -- FR-M8-03: `dibayar` needs the payment date and the transfer proof.
  constraint payouts_paid_check check (
    (status = 'dibayar') = (paid_at is not null and transfer_proof_path is not null)
  )
);

create index payouts_status_idx on public.payouts (status);

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row
  execute function public.set_updated_at();

create table public.client_payments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  invoice_number text not null unique,
  amount bigint not null,
  due_date date not null,
  -- Derived from amount and paid_amount by the trigger below.
  status public.client_payment_status not null default 'belum_dibayar',
  paid_amount bigint not null default 0,
  paid_at date,
  proof_path text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_payments_invoice_check check (length(trim(invoice_number)) > 0),
  constraint client_payments_amount_check check (amount > 0 and paid_amount >= 0),
  constraint client_payments_paid_at_check check (paid_amount = 0 or paid_at is not null)
);

create index client_payments_campaign_idx on public.client_payments (campaign_id);
create index client_payments_status_idx on public.client_payments (status);

create trigger client_payments_set_updated_at
  before update on public.client_payments
  for each row
  execute function public.set_updated_at();

-- Payout rules (FR-M8-01, FR-M8-03, FR-M8-04, PRD 8.3). Service-role / direct
-- SQL calls carry no JWT and pass through.
create or replace function public.guard_payout_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_status public.campaign_status;
  v_amounts_changed boolean;
begin
  if (select auth.uid()) is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draf' or not public.is_owner() then
      raise exception 'PAYOUT_LOCKED: only an owner can delete a draft payout';
    end if;
    return old;
  end if;

  select c.status into v_campaign_status
  from public.campaign_creators cc
  join public.campaigns c on c.id = cc.campaign_id
  where cc.id = new.campaign_creator_id;

  if tg_op = 'INSERT' then
    if v_campaign_status <> 'selesai' then
      raise exception 'PAYOUT_NEEDS_CLOSED_CAMPAIGN: payouts are calculated once the campaign is selesai';
    end if;
    new.status := 'draf';
    new.approved_by := null;
    new.approved_at := null;
    new.paid_at := null;
    new.transfer_proof_path := null;
    new.created_by := (select auth.uid());
    return new;
  end if;

  if new.campaign_creator_id is distinct from old.campaign_creator_id then
    raise exception 'PAYOUT_LOCKED: a payout cannot move to another assignment';
  end if;

  v_amounts_changed :=
    new.base_amount is distinct from old.base_amount
    or new.views_bonus is distinct from old.views_bonus
    or new.registrant_bonus is distinct from old.registrant_bonus
    or new.adjustment_amount is distinct from old.adjustment_amount
    or new.adjustment_reason is distinct from old.adjustment_reason
    or new.total_amount is distinct from old.total_amount
    or new.calculation_snapshot is distinct from old.calculation_snapshot;

  -- FR-M8-04: only drafts are recalculated or adjusted.
  if v_amounts_changed and old.status <> 'draf' then
    raise exception 'PAYOUT_LOCKED: only draft payouts can be recalculated or adjusted';
  end if;

  if new.status is distinct from old.status then
    -- FR-M8-03: status changes are owner-only.
    if not public.is_owner() then
      raise exception 'PAYOUT_OWNER_ONLY: only an owner can approve or mark a payout as paid';
    end if;
    if not (
      (old.status = 'draf' and new.status = 'disetujui')
      or (old.status = 'disetujui' and new.status in ('dibayar', 'draf'))
    ) then
      raise exception 'INVALID_PAYOUT_TRANSITION: % -> % is not allowed', old.status, new.status;
    end if;
    if new.status = 'disetujui' and old.status = 'draf' then
      new.approved_by := (select auth.uid());
      new.approved_at := now();
    elsif new.status = 'draf' then
      new.approved_by := null;
      new.approved_at := null;
    end if;
  elsif new.paid_at is distinct from old.paid_at
    or new.transfer_proof_path is distinct from old.transfer_proof_path
    or new.approved_by is distinct from old.approved_by
    or new.approved_at is distinct from old.approved_at
  then
    raise exception 'PAYOUT_LOCKED: approval and payment fields change only with a status change';
  end if;

  return new;
end;
$$;

create trigger payouts_guard
  before insert or update or delete on public.payouts
  for each row
  execute function public.guard_payout_change();

-- Client payments: status follows the paid amount (FR-M8-05); proofs are
-- owner-only (finance proofs, CLAUDE.md).
create or replace function public.guard_client_payment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if (select auth.uid()) is not null and not public.is_owner() then
      raise exception 'FINANCE_OWNER_ONLY: only an owner can delete a client payment';
    end if;
    return old;
  end if;

  if (select auth.uid()) is not null
    and not public.is_owner()
    and new.proof_path is distinct from (case when tg_op = 'UPDATE' then old.proof_path else null end)
  then
    raise exception 'FINANCE_OWNER_ONLY: only an owner can attach payment proofs';
  end if;

  new.status := case
    when new.paid_amount <= 0 then 'belum_dibayar'
    when new.paid_amount >= new.amount then 'lunas'
    else 'sebagian'
  end::public.client_payment_status;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  end if;

  return new;
end;
$$;

create trigger client_payments_guard
  before insert or update or delete on public.client_payments
  for each row
  execute function public.guard_client_payment_change();

alter table public.payouts enable row level security;

create policy "payouts_select_active_members"
  on public.payouts for select to authenticated
  using (public.is_active_member());

-- Both roles calculate drafts (FR-M8-01, FR-M8-02); the trigger keeps status
-- changes owner-only.
create policy "payouts_insert_active_members"
  on public.payouts for insert to authenticated
  with check (public.is_active_member());

create policy "payouts_update_active_members"
  on public.payouts for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "payouts_delete_owner"
  on public.payouts for delete to authenticated
  using (public.is_owner());

alter table public.client_payments enable row level security;

create policy "client_payments_select_active_members"
  on public.client_payments for select to authenticated
  using (public.is_active_member());

create policy "client_payments_insert_active_members"
  on public.client_payments for insert to authenticated
  with check (public.is_active_member());

create policy "client_payments_update_active_members"
  on public.client_payments for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "client_payments_delete_owner"
  on public.client_payments for delete to authenticated
  using (public.is_owner());

-- Finance proofs (transfer receipts, client payment proofs) are owner-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'finance-proofs',
  'finance-proofs',
  false,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "finance_proofs_objects_select_owner"
  on storage.objects for select to authenticated
  using (bucket_id = 'finance-proofs' and public.is_owner());

create policy "finance_proofs_objects_insert_owner"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'finance-proofs' and public.is_owner());

create policy "finance_proofs_objects_delete_owner"
  on storage.objects for delete to authenticated
  using (bucket_id = 'finance-proofs' and public.is_owner());
