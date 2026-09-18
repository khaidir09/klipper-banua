-- Phase 2 business-rule guards for campaigns and assignments. Run against the
-- LOCAL database only:  npm run db:guards-check
-- Every numbered step prints the error it is expected to raise (or the
-- successful result for step 5). Fixtures are removed at the end.

\set QUIET on
-- Fixtures as superuser.
insert into public.clients (id, name, type, province) values ('22222222-0000-0000-0000-000000000001','Guard Client','kampus_swasta','Kalimantan Selatan');
insert into public.creators (id, full_name, birth_date, province, status) values
 ('22222222-0000-0000-0000-0000000000a1','Verified C','1995-01-01','Kalimantan Selatan','terverifikasi'),
 ('22222222-0000-0000-0000-0000000000a2','Prospect C','1995-01-01','Kalimantan Selatan','prospek'),
 ('22222222-0000-0000-0000-0000000000a3','Blocked C','1995-01-01','Kalimantan Selatan','diblokir');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date) values
 ('22222222-0000-0000-0000-0000000000c1','22222222-0000-0000-0000-000000000001','GUARD-2026-01','Guard','pendaftar','2026-10-01','2026-10-31');
\set QUIET off

begin;
select set_config('request.jwt.claims', json_build_object('sub',(select id from public.profiles where role='manager' limit 1),'role','authenticated')::text, true);
set local role authenticated;

\echo '1. activate without landing url/creator (expect ACTIVATION_NEEDS_LANDING_URL)'
savepoint a; update public.campaigns set status='aktif' where id='22222222-0000-0000-0000-0000000000c1'; rollback to savepoint a;
\echo '2. assign prospect (expect CREATOR_NOT_VERIFIED)'
savepoint b; insert into public.campaign_creators (campaign_id, creator_id, referral_code, tracking_slug) values ('22222222-0000-0000-0000-0000000000c1','22222222-0000-0000-0000-0000000000a2','ABCDEF','prospect-c'); rollback to savepoint b;
\echo '3. assign blocked (expect CREATOR_BLOCKED)'
savepoint c; insert into public.campaign_creators (campaign_id, creator_id, referral_code, tracking_slug) values ('22222222-0000-0000-0000-0000000000c1','22222222-0000-0000-0000-0000000000a3','ABCDEG','blocked-c'); rollback to savepoint c;
\echo '4. ambiguous code O0I1 (expect format check violation)'
savepoint d; insert into public.campaign_creators (campaign_id, creator_id, referral_code, tracking_slug) values ('22222222-0000-0000-0000-0000000000c1','22222222-0000-0000-0000-0000000000a1','ABO0I1','verified-c'); rollback to savepoint d;
\echo '5. assign verified OK, set landing, activate OK'
insert into public.campaign_creators (campaign_id, creator_id, referral_code, tracking_slug) values ('22222222-0000-0000-0000-0000000000c1','22222222-0000-0000-0000-0000000000a1','ABCDEH','verified-c');
update public.campaigns set landing_url='https://pmb.example.ac.id/daftar' where id='22222222-0000-0000-0000-0000000000c1';
update public.campaigns set status='aktif' where id='22222222-0000-0000-0000-0000000000c1';
select status from public.campaigns where id='22222222-0000-0000-0000-0000000000c1';
\echo '6. manager inserts a click (expect RLS violation)'
savepoint e; insert into public.link_clicks (campaign_creator_id) select id from public.campaign_creators where tracking_slug='verified-c'; rollback to savepoint e;
\echo '7. aktif -> draft (expect INVALID_TRANSITION)'
savepoint f; update public.campaigns set status='draft' where id='22222222-0000-0000-0000-0000000000c1'; rollback to savepoint f;
reset role;
\echo '8. click recorded by service path, then code change (expect TRACKING_FROZEN)'
insert into public.link_clicks (campaign_creator_id) select id from public.campaign_creators where tracking_slug='verified-c';
set local role authenticated;
savepoint g; update public.campaign_creators set referral_code='XYZWVU' where tracking_slug='verified-c'; rollback to savepoint g;
\echo '9. close campaign, then manager edits it (expect CAMPAIGN_LOCKED)'
update public.campaigns set status='selesai' where id='22222222-0000-0000-0000-0000000000c1';
savepoint h; update public.campaigns set name='changed' where id='22222222-0000-0000-0000-0000000000c1'; rollback to savepoint h;
savepoint i; insert into public.campaign_assets (campaign_id, title, type, external_url) values ('22222222-0000-0000-0000-0000000000c1','x','tautan','https://x.test'); rollback to savepoint i;
rollback;

\set QUIET on
delete from public.campaigns where id='22222222-0000-0000-0000-0000000000c1';
delete from public.creators where id in ('22222222-0000-0000-0000-0000000000a1','22222222-0000-0000-0000-0000000000a2','22222222-0000-0000-0000-0000000000a3');
delete from public.clients where id='22222222-0000-0000-0000-000000000001';
