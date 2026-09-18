-- Phase 7: erase a creator's personal data on request (PRD section 9, UU PDP)
-- while campaign, content, metric and payout figures stay intact.

alter table public.creators add column anonymized_at timestamptz;

-- The birth date is personal data too; only anonymized creators may lack it.
alter table public.creators alter column birth_date drop not null;
alter table public.creators add constraint creators_birth_date_check
  check (birth_date is not null or anonymized_at is not null);

-- An anonymized creator stays anonymized: no edits, no new accounts.
create or replace function public.guard_anonymized_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'creators' then
    if old.anonymized_at is not null then
      raise exception 'CREATOR_ANONYMIZED: this creator''s data was erased';
    end if;
    return new;
  end if;

  if exists (
    select 1 from public.creators c
    where c.id = new.creator_id and c.anonymized_at is not null
  ) then
    raise exception 'CREATOR_ANONYMIZED: this creator''s data was erased';
  end if;
  return new;
end;
$$;

create trigger creators_guard_anonymized
  before update on public.creators
  for each row
  execute function public.guard_anonymized_creator();

create trigger creator_social_accounts_guard_anonymized
  before insert or update on public.creator_social_accounts
  for each row
  execute function public.guard_anonymized_creator();

create trigger creator_bank_accounts_guard_anonymized
  before insert or update on public.creator_bank_accounts
  for each row
  execute function public.guard_anonymized_creator();

/*
 * Owner-only, atomic erasure. Returns the audience-proof paths so the server
 * can remove the files from Storage afterwards. Kept: the creator row (for
 * assignment and payout history), tier, niches, province, terms consent
 * record, and every campaign figure. The public tracking slug is left as is:
 * it may already be printed and is frozen once clicks exist.
 */
create or replace function public.anonymize_creator(target_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  proof_paths text[];
  label text;
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

  delete from public.creator_social_accounts where creator_id = target_id;
  delete from public.creator_bank_accounts where creator_id = target_id;

  label := 'Kreator anonim ' || upper(substr(replace(target_id::text, '-', ''), 1, 4));

  update public.creators
    set full_name = label,
        stage_name = label,
        phone_wa = '',
        email = '',
        city = '',
        birth_date = null,
        notes = '',
        status = 'diblokir',
        anonymized_at = now()
    where id = target_id;

  -- Names were written into the audit trail when the creator was saved.
  update public.activity_logs
    set details = details - 'full_name' - 'stage_name' - 'phone_wa' - 'email'
    where entity_type = 'creator' and entity_id = target_id;

  return proof_paths;
end;
$$;

revoke execute on function public.anonymize_creator(uuid) from public, anon;
grant execute on function public.anonymize_creator(uuid) to authenticated;
