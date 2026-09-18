-- Anonymized creators get a label from the END of their id (the random part
-- of a v4 UUID; ids sharing a prefix no longer collide) and an empty stage
-- name, so pages do not show "@Kreator anonim …".

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
        anonymized_at = now()
    where id = target_id;

  update public.activity_logs
    set details = details - 'full_name' - 'stage_name' - 'phone_wa' - 'email'
    where entity_type = 'creator' and entity_id = target_id;

  return proof_paths;
end;
$$;

revoke execute on function public.anonymize_creator(uuid) from public, anon;
grant execute on function public.anonymize_creator(uuid) to authenticated;

-- Creators anonymized before this migration keep their data erased; only the
-- label and stage name are brought in line.
alter table public.creators disable trigger creators_guard_anonymized;
update public.creators
  set full_name = 'Kreator anonim ' || upper(right(replace(id::text, '-', ''), 6)),
      stage_name = ''
  where anonymized_at is not null;
alter table public.creators enable trigger creators_guard_anonymized;
