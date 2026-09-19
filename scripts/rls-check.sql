-- RLS matrix for every table and storage bucket. Run against the LOCAL
-- database only (needs the seed owner and manager accounts):
--
--   npm run db:rls-check
--
-- Each table is exercised with SELECT / INSERT / UPDATE / DELETE as `owner`,
-- `manager`, an inactive member and `anon`, and compared with the expected
-- outcome. Triggers are switched off (session_replication_role = replica) so
-- only grants, RLS policies and CHECK constraints decide; business rules are
-- covered by scripts/guards-check.sql. Everything runs in one transaction and
-- is rolled back. The last statement fails the run when anything is off.

\set ON_ERROR_STOP 1
\set QUIET on
begin;
set local session_replication_role = replica;

create temporary table rls_ids on commit drop as
select
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id,
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  'f1000000-0000-4000-8000-000000000099'::uuid as inactive_id;

do $$
begin
  if (select owner_id is null or manager_id is null from rls_ids) then
    raise exception 'Seed accounts missing: run npm run seed:owner with SEED_MANAGER_* set.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures (ids f1…); one row per table so each operation has a target.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, role, is_active)
values ('f1000000-0000-4000-8000-000000000099', 'RLS Inactive', 'manager', false);
insert into public.clients (id, name, type, province)
values ('f1000000-0000-4000-8000-000000000001', 'RLS Client', 'kampus_swasta', 'Kalimantan Selatan');
insert into public.client_contacts (id, client_id, name)
values ('f1000000-0000-4000-8000-000000000002', 'f1000000-0000-4000-8000-000000000001', 'RLS Contact');
insert into public.creators (id, full_name, birth_date, province) values
  ('f1000000-0000-4000-8000-000000000003', 'RLS Creator', '1995-01-01', 'Kalimantan Selatan'),
  ('f1000000-0000-4000-8000-000000000004', 'RLS Creator Two', '1995-01-01', 'Kalimantan Selatan'),
  ('f1000000-0000-4000-8000-000000000020', 'RLS Creator Three', '1995-01-01', 'Kalimantan Selatan');
insert into public.creator_social_accounts (id, creator_id, platform, handle)
values ('f1000000-0000-4000-8000-000000000005', 'f1000000-0000-4000-8000-000000000003', 'tiktok', 'rls.fixture');
insert into public.creator_bank_accounts (id, creator_id, bank_name, account_number, account_holder)
values ('f1000000-0000-4000-8000-000000000006', 'f1000000-0000-4000-8000-000000000003', 'Bank Kalsel', '1234567890', 'RLS Creator');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status)
values ('f1000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000001', 'RLS-FIX-01', 'RLS', 'awareness', '2026-10-01', '2026-10-31', 'aktif');
insert into public.campaign_assets (id, campaign_id, title, type, external_url)
values ('f1000000-0000-4000-8000-000000000008', 'f1000000-0000-4000-8000-000000000007', 'Logo', 'tautan', 'https://example.com/logo');
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug) values
  ('f1000000-0000-4000-8000-000000000009', 'f1000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000003', 'RLSAAA', 'rls-fixture-a'),
  ('f1000000-0000-4000-8000-000000000010', 'f1000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000004', 'RLSBBB', 'rls-fixture-b');
insert into public.contents (id, campaign_creator_id, platform, draft_url)
values ('f1000000-0000-4000-8000-000000000011', 'f1000000-0000-4000-8000-000000000009', 'tiktok', 'https://example.com/draft');
insert into public.content_reviews (id, content_id, decision)
values ('f1000000-0000-4000-8000-000000000012', 'f1000000-0000-4000-8000-000000000011', 'disetujui');
insert into public.metric_snapshots (id, content_id, checkpoint, captured_at, proof_path)
values ('f1000000-0000-4000-8000-000000000013', 'f1000000-0000-4000-8000-000000000011', 'H+1', now(), 'x/proof.png');
insert into public.link_clicks (id, campaign_creator_id)
values ('f1000000-0000-4000-8000-000000000014', 'f1000000-0000-4000-8000-000000000009');
insert into public.registrant_reports (id, campaign_id, period_start, period_end, registrant_count)
values ('f1000000-0000-4000-8000-000000000015', 'f1000000-0000-4000-8000-000000000007', '2026-10-01', '2026-10-07', 3);
insert into public.payouts (id, campaign_creator_id)
values ('f1000000-0000-4000-8000-000000000016', 'f1000000-0000-4000-8000-000000000009');
insert into public.client_payments (id, campaign_id, invoice_number, amount, due_date)
values ('f1000000-0000-4000-8000-000000000017', 'f1000000-0000-4000-8000-000000000007', 'RLS-INV-1', 1000000, '2026-11-01');
insert into public.ops_time_logs (id, campaign_id, user_id, activity, minutes, log_date)
values ('f1000000-0000-4000-8000-000000000018', 'f1000000-0000-4000-8000-000000000007', (select owner_id from rls_ids), 'review', 30, '2026-10-02');
insert into public.report_share_links (id, campaign_id, token_hash, created_by)
values ('f1000000-0000-4000-8000-000000000021', 'f1000000-0000-4000-8000-000000000007', repeat('c', 64), (select owner_id from rls_ids));
insert into public.activity_logs (id, actor_id, entity_type, entity_id, action)
values ('f1000000-0000-4000-8000-000000000019', (select owner_id from rls_ids), 'client', 'f1000000-0000-4000-8000-000000000001', 'create');
insert into storage.objects (bucket_id, name)
select bucket, 'rls-check/' || bucket || '.png'
from unnest(array['audience-proofs', 'campaign-assets', 'content-drafts', 'metric-proofs', 'finance-proofs']) as bucket;

-- ---------------------------------------------------------------------------
-- Probe: runs one statement as a role and reports allow / deny / error.
-- The statement's effect is always undone by raising inside a sub-block.
-- ---------------------------------------------------------------------------
create function pg_temp.probe(p_role text, p_sub uuid, p_sql text, p_is_count boolean)
returns text
language plpgsql
as $$
declare
  affected bigint;
begin
  begin
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', p_sub, 'role', case when p_role = 'anon' then 'anon' else 'authenticated' end)::text,
      true
    );
    execute format('set local role %I', case when p_role = 'anon' then 'anon' else 'authenticated' end);
    if p_is_count then
      execute p_sql into affected;
    else
      execute p_sql;
      get diagnostics affected = row_count;
    end if;
    raise exception using errcode = 'P0001', message = 'RLS_PROBE:' || affected;
  exception
    when insufficient_privilege then
      return 'deny';
    when raise_exception then
      if sqlerrm like 'RLS_PROBE:%' then
        return case when substr(sqlerrm, 11)::bigint > 0 then 'allow' else 'deny' end;
      end if;
      return 'error: ' || sqlerrm;
    when others then
      return 'error: ' || sqlerrm;
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Statements per table and operation (%s = the acting user's id).
-- ---------------------------------------------------------------------------
create temporary table rls_cases (tbl text, op text, sql text) on commit drop;
insert into rls_cases values
  ('profiles', 'select', $q$select count(*) from public.profiles where id = 'f1000000-0000-4000-8000-000000000099'$q$),
  ('profiles', 'insert', $q$insert into public.profiles (id, full_name) values (gen_random_uuid(), 'x')$q$),
  ('profiles', 'update', $q$update public.profiles set full_name = full_name where id = 'f1000000-0000-4000-8000-000000000099'$q$),
  ('profiles', 'delete', $q$delete from public.profiles where id = 'f1000000-0000-4000-8000-000000000099'$q$),

  ('clients', 'select', $q$select count(*) from public.clients where id = 'f1000000-0000-4000-8000-000000000001'$q$),
  ('clients', 'insert', $q$insert into public.clients (name, type, province) values ('x', 'umkm', 'Kalimantan Selatan')$q$),
  ('clients', 'update', $q$update public.clients set notes = notes where id = 'f1000000-0000-4000-8000-000000000001'$q$),
  ('clients', 'delete', $q$delete from public.clients where id = 'f1000000-0000-4000-8000-000000000001'$q$),

  ('client_contacts', 'select', $q$select count(*) from public.client_contacts where id = 'f1000000-0000-4000-8000-000000000002'$q$),
  ('client_contacts', 'insert', $q$insert into public.client_contacts (client_id, name) values ('f1000000-0000-4000-8000-000000000001', 'x')$q$),
  ('client_contacts', 'update', $q$update public.client_contacts set name = name where id = 'f1000000-0000-4000-8000-000000000002'$q$),
  ('client_contacts', 'delete', $q$delete from public.client_contacts where id = 'f1000000-0000-4000-8000-000000000002'$q$),

  ('creators', 'select', $q$select count(*) from public.creators where id = 'f1000000-0000-4000-8000-000000000003'$q$),
  ('creators', 'insert', $q$insert into public.creators (full_name, birth_date, province) values ('x', '1995-01-01', 'Kalimantan Selatan')$q$),
  ('creators', 'update', $q$update public.creators set notes = notes where id = 'f1000000-0000-4000-8000-000000000003'$q$),
  ('creators', 'delete', $q$delete from public.creators where id = 'f1000000-0000-4000-8000-000000000003'$q$),

  ('creator_social_accounts', 'select', $q$select count(*) from public.creator_social_accounts where id = 'f1000000-0000-4000-8000-000000000005'$q$),
  ('creator_social_accounts', 'insert', $q$insert into public.creator_social_accounts (creator_id, platform, handle) values ('f1000000-0000-4000-8000-000000000003', 'instagram', 'rls.insert')$q$),
  ('creator_social_accounts', 'update', $q$update public.creator_social_accounts set top_cities = top_cities where id = 'f1000000-0000-4000-8000-000000000005'$q$),
  ('creator_social_accounts', 'delete', $q$delete from public.creator_social_accounts where id = 'f1000000-0000-4000-8000-000000000005'$q$),

  ('creator_bank_accounts', 'select', $q$select count(*) from public.creator_bank_accounts where id = 'f1000000-0000-4000-8000-000000000006'$q$),
  ('creator_bank_accounts', 'insert', $q$insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder) values ('f1000000-0000-4000-8000-000000000004', 'BRI', '98765432', 'x')$q$),
  ('creator_bank_accounts', 'update', $q$update public.creator_bank_accounts set bank_name = bank_name where id = 'f1000000-0000-4000-8000-000000000006'$q$),
  ('creator_bank_accounts', 'delete', $q$delete from public.creator_bank_accounts where id = 'f1000000-0000-4000-8000-000000000006'$q$),

  ('campaigns', 'select', $q$select count(*) from public.campaigns where id = 'f1000000-0000-4000-8000-000000000007'$q$),
  ('campaigns', 'insert', $q$insert into public.campaigns (client_id, code, name, objective, start_date, end_date) values ('f1000000-0000-4000-8000-000000000001', 'RLS-INS-01', 'x', 'awareness', '2026-10-01', '2026-10-31')$q$),
  ('campaigns', 'update', $q$update public.campaigns set brief = brief where id = 'f1000000-0000-4000-8000-000000000007'$q$),
  ('campaigns', 'delete', $q$delete from public.campaigns where id = 'f1000000-0000-4000-8000-000000000007'$q$),

  ('campaign_assets', 'select', $q$select count(*) from public.campaign_assets where id = 'f1000000-0000-4000-8000-000000000008'$q$),
  ('campaign_assets', 'insert', $q$insert into public.campaign_assets (campaign_id, title, type, external_url) values ('f1000000-0000-4000-8000-000000000007', 'x', 'tautan', 'https://example.com/x')$q$),
  ('campaign_assets', 'update', $q$update public.campaign_assets set notes = notes where id = 'f1000000-0000-4000-8000-000000000008'$q$),
  ('campaign_assets', 'delete', $q$delete from public.campaign_assets where id = 'f1000000-0000-4000-8000-000000000008'$q$),

  ('campaign_creators', 'select', $q$select count(*) from public.campaign_creators where id = 'f1000000-0000-4000-8000-000000000009'$q$),
  ('campaign_creators', 'insert', $q$insert into public.campaign_creators (campaign_id, creator_id, referral_code, tracking_slug) values ('f1000000-0000-4000-8000-000000000007', 'f1000000-0000-4000-8000-000000000020', 'RLSCCC', 'rls-insert-c')$q$),
  ('campaign_creators', 'update', $q$update public.campaign_creators set contents_committed = contents_committed where id = 'f1000000-0000-4000-8000-000000000009'$q$),
  ('campaign_creators', 'delete', $q$delete from public.campaign_creators where id = 'f1000000-0000-4000-8000-000000000010'$q$),

  ('contents', 'select', $q$select count(*) from public.contents where id = 'f1000000-0000-4000-8000-000000000011'$q$),
  ('contents', 'insert', $q$insert into public.contents (campaign_creator_id, platform, draft_url) values ('f1000000-0000-4000-8000-000000000009', 'instagram', 'https://example.com/d2')$q$),
  ('contents', 'update', $q$update public.contents set caption_draft = caption_draft where id = 'f1000000-0000-4000-8000-000000000011'$q$),
  ('contents', 'delete', $q$delete from public.contents where id = 'f1000000-0000-4000-8000-000000000011'$q$),

  ('content_reviews', 'select', $q$select count(*) from public.content_reviews where id = 'f1000000-0000-4000-8000-000000000012'$q$),
  ('content_reviews', 'insert', $q$insert into public.content_reviews (content_id, decision) values ('f1000000-0000-4000-8000-000000000011', 'ditolak')$q$),
  ('content_reviews', 'update', $q$update public.content_reviews set notes = notes where id = 'f1000000-0000-4000-8000-000000000012'$q$),
  ('content_reviews', 'delete', $q$delete from public.content_reviews where id = 'f1000000-0000-4000-8000-000000000012'$q$),

  ('metric_snapshots', 'select', $q$select count(*) from public.metric_snapshots where id = 'f1000000-0000-4000-8000-000000000013'$q$),
  ('metric_snapshots', 'insert', $q$insert into public.metric_snapshots (content_id, checkpoint, captured_at, proof_path) values ('f1000000-0000-4000-8000-000000000011', 'lainnya', now(), 'x/p.png')$q$),
  ('metric_snapshots', 'update', $q$update public.metric_snapshots set views = views where id = 'f1000000-0000-4000-8000-000000000013'$q$),
  ('metric_snapshots', 'delete', $q$delete from public.metric_snapshots where id = 'f1000000-0000-4000-8000-000000000013'$q$),

  ('link_clicks', 'select', $q$select count(*) from public.link_clicks where id = 'f1000000-0000-4000-8000-000000000014'$q$),
  ('link_clicks', 'insert', $q$insert into public.link_clicks (campaign_creator_id) values ('f1000000-0000-4000-8000-000000000009')$q$),
  ('link_clicks', 'update', $q$update public.link_clicks set is_bot = is_bot where id = 'f1000000-0000-4000-8000-000000000014'$q$),
  ('link_clicks', 'delete', $q$delete from public.link_clicks where id = 'f1000000-0000-4000-8000-000000000014'$q$),

  ('registrant_reports', 'select', $q$select count(*) from public.registrant_reports where id = 'f1000000-0000-4000-8000-000000000015'$q$),
  ('registrant_reports', 'insert', $q$insert into public.registrant_reports (campaign_id, period_start, period_end, registrant_count) values ('f1000000-0000-4000-8000-000000000007', '2026-10-08', '2026-10-14', 1)$q$),
  ('registrant_reports', 'update', $q$update public.registrant_reports set notes = notes where id = 'f1000000-0000-4000-8000-000000000015'$q$),
  ('registrant_reports', 'delete', $q$delete from public.registrant_reports where id = 'f1000000-0000-4000-8000-000000000015'$q$),

  ('payouts', 'select', $q$select count(*) from public.payouts where id = 'f1000000-0000-4000-8000-000000000016'$q$),
  ('payouts', 'insert', $q$insert into public.payouts (campaign_creator_id) values ('f1000000-0000-4000-8000-000000000010')$q$),
  ('payouts', 'update', $q$update public.payouts set adjustment_reason = adjustment_reason where id = 'f1000000-0000-4000-8000-000000000016'$q$),
  ('payouts', 'delete', $q$delete from public.payouts where id = 'f1000000-0000-4000-8000-000000000016'$q$),

  ('client_payments', 'select', $q$select count(*) from public.client_payments where id = 'f1000000-0000-4000-8000-000000000017'$q$),
  ('client_payments', 'insert', $q$insert into public.client_payments (campaign_id, invoice_number, amount, due_date) values ('f1000000-0000-4000-8000-000000000007', 'RLS-INV-2', 500000, '2026-11-01')$q$),
  ('client_payments', 'update', $q$update public.client_payments set due_date = due_date where id = 'f1000000-0000-4000-8000-000000000017'$q$),
  ('client_payments', 'delete', $q$delete from public.client_payments where id = 'f1000000-0000-4000-8000-000000000017'$q$),

  -- The fixture entry belongs to the owner; inserts log time for the caller.
  ('ops_time_logs', 'select', $q$select count(*) from public.ops_time_logs where id = 'f1000000-0000-4000-8000-000000000018'$q$),
  ('ops_time_logs', 'insert', $q$insert into public.ops_time_logs (campaign_id, user_id, activity, minutes, log_date) values ('f1000000-0000-4000-8000-000000000007', '%s', 'laporan', 15, '2026-10-03')$q$),
  ('ops_time_logs', 'update', $q$update public.ops_time_logs set notes = notes where id = 'f1000000-0000-4000-8000-000000000018'$q$),
  ('ops_time_logs', 'delete', $q$delete from public.ops_time_logs where id = 'f1000000-0000-4000-8000-000000000018'$q$),

  -- The fixture link is open, so the insert adds an already revoked one (one open link per campaign).
  ('report_share_links', 'select', $q$select count(*) from public.report_share_links where id = 'f1000000-0000-4000-8000-000000000021'$q$),
  ('report_share_links', 'insert', $q$insert into public.report_share_links (campaign_id, token_hash, created_by, revoked_at, revoked_by) values ('f1000000-0000-4000-8000-000000000007', repeat('ab', 32), '%s', now(), '%s')$q$),
  ('report_share_links', 'update', $q$update public.report_share_links set revoked_at = revoked_at where id = 'f1000000-0000-4000-8000-000000000021'$q$),
  ('report_share_links', 'delete', $q$delete from public.report_share_links where id = 'f1000000-0000-4000-8000-000000000021'$q$),

  ('activity_logs', 'select', $q$select count(*) from public.activity_logs where id = 'f1000000-0000-4000-8000-000000000019'$q$),
  ('activity_logs', 'insert', $q$insert into public.activity_logs (actor_id, entity_type, action) values ('%s', 'client', 'update')$q$),
  ('activity_logs', 'update', $q$update public.activity_logs set details = details where id = 'f1000000-0000-4000-8000-000000000019'$q$),
  ('activity_logs', 'delete', $q$delete from public.activity_logs where id = 'f1000000-0000-4000-8000-000000000019'$q$);

-- Storage buckets: list, upload, remove.
insert into rls_cases
select 'storage:' || bucket, op, sql
from unnest(array['audience-proofs', 'campaign-assets', 'content-drafts', 'metric-proofs', 'finance-proofs']) as bucket,
lateral (values
  ('select', format($q$select count(*) from storage.objects where bucket_id = %L and name = %L$q$, bucket, 'rls-check/' || bucket || '.png')),
  ('insert', format($q$insert into storage.objects (bucket_id, name) values (%L, %L)$q$, bucket, 'rls-check/new-' || bucket || '.png')),
  ('delete', format($q$delete from storage.objects where bucket_id = %L and name = %L$q$, bucket, 'rls-check/' || bucket || '.png'))
) as ops(op, sql);

-- ---------------------------------------------------------------------------
-- Expected outcome: owner / manager / inactive member / anon (a = allow).
-- ---------------------------------------------------------------------------
create temporary table rls_expected (tbl text, op text, owner text, manager text, inactive text, anon text) on commit drop;
insert into rls_expected values
  -- Everyone signed in sees their own profile (to learn they were deactivated).
  ('profiles', 'select', 'a', 'a', 'a', 'd'),
  ('profiles', 'insert', 'd', 'd', 'd', 'd'),
  ('profiles', 'update', 'a', 'd', 'd', 'd'),
  ('profiles', 'delete', 'd', 'd', 'd', 'd'),
  ('clients', 'select', 'a', 'a', 'd', 'd'),
  ('clients', 'insert', 'a', 'a', 'd', 'd'),
  ('clients', 'update', 'a', 'a', 'd', 'd'),
  ('clients', 'delete', 'a', 'd', 'd', 'd'),
  ('client_contacts', 'select', 'a', 'a', 'd', 'd'),
  ('client_contacts', 'insert', 'a', 'a', 'd', 'd'),
  ('client_contacts', 'update', 'a', 'a', 'd', 'd'),
  ('client_contacts', 'delete', 'a', 'a', 'd', 'd'),
  ('creators', 'select', 'a', 'a', 'd', 'd'),
  ('creators', 'insert', 'a', 'a', 'd', 'd'),
  ('creators', 'update', 'a', 'a', 'd', 'd'),
  ('creators', 'delete', 'a', 'd', 'd', 'd'),
  ('creator_social_accounts', 'select', 'a', 'a', 'd', 'd'),
  ('creator_social_accounts', 'insert', 'a', 'a', 'd', 'd'),
  ('creator_social_accounts', 'update', 'a', 'a', 'd', 'd'),
  ('creator_social_accounts', 'delete', 'a', 'a', 'd', 'd'),
  -- CLAUDE.md: bank accounts are owner-only (managers use the masked function).
  ('creator_bank_accounts', 'select', 'a', 'd', 'd', 'd'),
  ('creator_bank_accounts', 'insert', 'a', 'd', 'd', 'd'),
  ('creator_bank_accounts', 'update', 'a', 'd', 'd', 'd'),
  ('creator_bank_accounts', 'delete', 'a', 'd', 'd', 'd'),
  ('campaigns', 'select', 'a', 'a', 'd', 'd'),
  ('campaigns', 'insert', 'a', 'a', 'd', 'd'),
  ('campaigns', 'update', 'a', 'a', 'd', 'd'),
  ('campaigns', 'delete', 'a', 'd', 'd', 'd'),
  ('campaign_assets', 'select', 'a', 'a', 'd', 'd'),
  ('campaign_assets', 'insert', 'a', 'a', 'd', 'd'),
  ('campaign_assets', 'update', 'a', 'a', 'd', 'd'),
  ('campaign_assets', 'delete', 'a', 'a', 'd', 'd'),
  ('campaign_creators', 'select', 'a', 'a', 'd', 'd'),
  ('campaign_creators', 'insert', 'a', 'a', 'd', 'd'),
  ('campaign_creators', 'update', 'a', 'a', 'd', 'd'),
  ('campaign_creators', 'delete', 'a', 'a', 'd', 'd'),
  ('contents', 'select', 'a', 'a', 'd', 'd'),
  ('contents', 'insert', 'a', 'a', 'd', 'd'),
  ('contents', 'update', 'a', 'a', 'd', 'd'),
  ('contents', 'delete', 'a', 'a', 'd', 'd'),
  -- Review history is append-only.
  ('content_reviews', 'select', 'a', 'a', 'd', 'd'),
  ('content_reviews', 'insert', 'a', 'a', 'd', 'd'),
  ('content_reviews', 'update', 'd', 'd', 'd', 'd'),
  ('content_reviews', 'delete', 'd', 'd', 'd', 'd'),
  ('metric_snapshots', 'select', 'a', 'a', 'd', 'd'),
  ('metric_snapshots', 'insert', 'a', 'a', 'd', 'd'),
  ('metric_snapshots', 'update', 'a', 'a', 'd', 'd'),
  ('metric_snapshots', 'delete', 'a', 'a', 'd', 'd'),
  -- Clicks are written only by the /r/[slug] route with the service role.
  ('link_clicks', 'select', 'a', 'a', 'd', 'd'),
  ('link_clicks', 'insert', 'd', 'd', 'd', 'd'),
  ('link_clicks', 'update', 'd', 'd', 'd', 'd'),
  ('link_clicks', 'delete', 'd', 'd', 'd', 'd'),
  ('registrant_reports', 'select', 'a', 'a', 'd', 'd'),
  ('registrant_reports', 'insert', 'a', 'a', 'd', 'd'),
  ('registrant_reports', 'update', 'a', 'a', 'd', 'd'),
  ('registrant_reports', 'delete', 'a', 'a', 'd', 'd'),
  ('payouts', 'select', 'a', 'a', 'd', 'd'),
  ('payouts', 'insert', 'a', 'a', 'd', 'd'),
  ('payouts', 'update', 'a', 'a', 'd', 'd'),
  ('payouts', 'delete', 'a', 'd', 'd', 'd'),
  ('client_payments', 'select', 'a', 'a', 'd', 'd'),
  ('client_payments', 'insert', 'a', 'a', 'd', 'd'),
  ('client_payments', 'update', 'a', 'a', 'd', 'd'),
  ('client_payments', 'delete', 'a', 'd', 'd', 'd'),
  -- Own entries only; the owner may edit or remove anyone's.
  ('ops_time_logs', 'select', 'a', 'a', 'd', 'd'),
  ('ops_time_logs', 'insert', 'a', 'a', 'd', 'd'),
  ('ops_time_logs', 'update', 'a', 'd', 'd', 'd'),
  ('ops_time_logs', 'delete', 'a', 'd', 'd', 'd'),
  -- FR-M9-05: members create and revoke client links; none are ever deleted.
  ('report_share_links', 'select', 'a', 'a', 'd', 'd'),
  ('report_share_links', 'insert', 'a', 'a', 'd', 'd'),
  ('report_share_links', 'update', 'a', 'a', 'd', 'd'),
  ('report_share_links', 'delete', 'd', 'd', 'd', 'd'),
  -- Audit trail: members append as themselves; only the owner reads; no edits.
  ('activity_logs', 'select', 'a', 'd', 'd', 'd'),
  ('activity_logs', 'insert', 'a', 'a', 'd', 'd'),
  ('activity_logs', 'update', 'd', 'd', 'd', 'd'),
  ('activity_logs', 'delete', 'd', 'd', 'd', 'd'),
  ('storage:audience-proofs', 'select', 'a', 'a', 'd', 'd'),
  ('storage:audience-proofs', 'insert', 'a', 'a', 'd', 'd'),
  ('storage:audience-proofs', 'delete', 'a', 'a', 'd', 'd'),
  ('storage:campaign-assets', 'select', 'a', 'a', 'd', 'd'),
  ('storage:campaign-assets', 'insert', 'a', 'a', 'd', 'd'),
  ('storage:campaign-assets', 'delete', 'a', 'a', 'd', 'd'),
  ('storage:content-drafts', 'select', 'a', 'a', 'd', 'd'),
  ('storage:content-drafts', 'insert', 'a', 'a', 'd', 'd'),
  ('storage:content-drafts', 'delete', 'a', 'a', 'd', 'd'),
  ('storage:metric-proofs', 'select', 'a', 'a', 'd', 'd'),
  ('storage:metric-proofs', 'insert', 'a', 'a', 'd', 'd'),
  ('storage:metric-proofs', 'delete', 'a', 'a', 'd', 'd'),
  -- CLAUDE.md: finance proofs are owner-only.
  ('storage:finance-proofs', 'select', 'a', 'd', 'd', 'd'),
  ('storage:finance-proofs', 'insert', 'a', 'd', 'd', 'd'),
  ('storage:finance-proofs', 'delete', 'a', 'd', 'd', 'd');

-- ---------------------------------------------------------------------------
-- Run every case for every role.
-- ---------------------------------------------------------------------------
create temporary table rls_results on commit drop as
select
  c.tbl,
  c.op,
  r.role_name,
  case r.role_name
    when 'owner' then e.owner
    when 'manager' then e.manager
    when 'inactive' then e.inactive
    else e.anon
  end as expected,
  pg_temp.probe(
    r.role_name,
    r.sub,
    replace(c.sql, '%s', coalesce(r.sub, (select owner_id from rls_ids))::text),
    c.op = 'select'
  ) as actual
from rls_cases c
join rls_expected e using (tbl, op)
cross join lateral (values
  ('owner', (select owner_id from rls_ids)),
  ('manager', (select manager_id from rls_ids)),
  ('inactive', (select inactive_id from rls_ids)),
  ('anon', null::uuid)
) as r(role_name, sub);

\set QUIET off
\echo '--- RLS matrix (a = allow, d = deny; owner / manager / inactive / anon) ---'
select
  tbl as "table",
  op,
  string_agg(
    case when left(actual, 1) = expected then upper(expected) else '✗' || left(actual, 5) end,
    ' / ' order by array_position(array['owner', 'manager', 'inactive', 'anon'], role_name)
  ) as "owner / manager / inactive / anon"
from rls_results
group by tbl, op
order by tbl, array_position(array['select', 'insert', 'update', 'delete'], op);

\echo '--- Mismatches (expect 0 rows) ---'
select tbl as "table", op, role_name as role, expected, actual
from rls_results
where left(actual, 1) <> expected
order by 1, 2, 3;

-- Every public table must have RLS on, at least one policy, and a row in the
-- matrix above, so a new table cannot slip through untested.
\echo '--- Tables without RLS, policies or matrix coverage (expect 0 rows) ---'
select c.relname as "table",
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies,
       exists (select 1 from rls_expected e where e.tbl = c.relname) as in_matrix
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and (
    not c.relrowsecurity
    or not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
    or not exists (select 1 from rls_expected e where e.tbl = c.relname)
  );

\echo '--- Manager reads bank details only masked (expect bank + ******7890) ---'
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from rls_ids), 'role', 'authenticated')::text, true) is not null as claims_set;
set local role authenticated;
select bank_name, account_number_masked from public.get_masked_bank_account('f1000000-0000-4000-8000-000000000003');
reset role;

-- Fail the run (non-zero exit) on any mismatch or uncovered table.
do $$
declare
  failures int;
begin
  select count(*) into failures from rls_results where left(actual, 1) <> expected;
  failures := failures + (
    select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and (not c.relrowsecurity
        or not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
        or not exists (select 1 from rls_expected e where e.tbl = c.relname))
  );
  if failures > 0 then
    raise exception 'RLS check failed: % problem(s), see above', failures;
  end if;
  raise notice 'RLS check passed: % cases', (select count(*) from rls_results);
end;
$$;

rollback;
