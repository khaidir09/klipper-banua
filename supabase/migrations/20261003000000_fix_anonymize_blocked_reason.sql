-- Fix: anonymize_creator() failed since Phase 15 (FR-M16-09).
--
-- Erasing a creator also blocks the row (status `diblokir`), but Phase 15
-- added creators_blocked_reason_check, which requires a reason for every
-- blocked creator. The update carried none, so every erasure - including the
-- account deletions klippers request from the portal - was rolled back.
-- The body below is the previous one with a reason added; nothing else moves.
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
        -- Keeps an earlier block reason (e.g. proven fraud); otherwise says why.
        blocked_reason = coalesce(nullif(trim(blocked_reason), ''), 'Data pribadi dianonimkan'),
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
