-- RLS smoke test for phase 1 tables. Run against the LOCAL database only:
--   npm run db:rls-check
-- Expected: manager sees 0 bank rows and the masked view, insert is rejected;
-- owner sees the full row; anon sees no creators.
-- Fixture inserted as superuser (bypasses RLS).
insert into public.creators (id, full_name, birth_date, province)
values ('11111111-1111-1111-1111-111111111111', 'RLS Test Creator', '1995-01-01', 'Kalimantan Selatan')
on conflict (id) do nothing;
insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder)
values ('11111111-1111-1111-1111-111111111111', 'Bank Kalsel', '1234567890', 'RLS Test Creator')
on conflict (creator_id) do nothing;

\echo '--- as MANAGER: direct select on creator_bank_accounts (expect 0 rows) ---'
begin;
select set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'manager' limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;
select count(*) as rows_visible from public.creator_bank_accounts;
\echo '--- as MANAGER: masked function (expect bank + ******7890) ---'
select * from public.get_masked_bank_account('11111111-1111-1111-1111-111111111111');
\echo '--- as MANAGER: insert attempt (expect error) ---'
savepoint s1;
insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder)
values ('11111111-1111-1111-1111-111111111111', 'X', '0000', 'X');
rollback to savepoint s1;
\echo '--- as MANAGER: activity_logs select (expect 0 rows) ---'
select count(*) as logs_visible from public.activity_logs;
rollback;

\echo '--- as OWNER: direct select (expect 1 row) ---'
begin;
select set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner' limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;
select creator_id, bank_name, account_number from public.creator_bank_accounts;
rollback;

\echo '--- as ANON: creators select (expect 0 rows) ---'
begin;
set local role anon;
select count(*) as creators_visible from public.creators;
rollback;

-- Clean up the fixture.
delete from public.creators where id = '11111111-1111-1111-1111-111111111111';

-- Finance proofs are owner-only (CLAUDE.md): a manager cannot even list them.
begin;
\set QUIET on
insert into storage.objects (bucket_id, name) values ('finance-proofs', 'rls-check/transfer.pdf');
\set QUIET off
\echo '--- as MANAGER: finance-proofs objects (expect 0) ---'
select set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'manager' limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;
select count(*) as finance_proofs_visible from storage.objects where bucket_id = 'finance-proofs' and name like 'rls-check/%';
reset role;
\echo '--- as OWNER: finance-proofs objects (expect 1) ---'
select set_config('request.jwt.claims', json_build_object('sub', (select id from public.profiles where role = 'owner' limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;
select count(*) as finance_proofs_visible from storage.objects where bucket_id = 'finance-proofs' and name like 'rls-check/%';
rollback;
