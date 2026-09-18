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

-- ---------------------------------------------------------------------------
-- Phase 3: content review workflow (PRD M6)
-- ---------------------------------------------------------------------------
\set QUIET on
insert into public.clients (id, name, type, province) values ('44444444-0000-0000-0000-000000000001','Review Client','kampus_swasta','Kalimantan Selatan');
insert into public.creators (id, full_name, birth_date, province, status) values ('44444444-0000-0000-0000-0000000000a1','Review C','1995-01-01','Kalimantan Selatan','terverifikasi');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, paid_label_required) values ('44444444-0000-0000-0000-0000000000c1','44444444-0000-0000-0000-000000000001','REVIEW-2026-01','Review','awareness','2026-10-01','2026-10-31', true);
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug) values ('44444444-0000-0000-0000-0000000000d1','44444444-0000-0000-0000-0000000000c1','44444444-0000-0000-0000-0000000000a1','RVWABC','review-c');
\set QUIET off

begin;
select set_config('request.jwt.claims', json_build_object('sub',(select id from public.profiles where role='manager' limit 1),'role','authenticated')::text, true);
set local role authenticated;

\echo 'P3-1. record content (expect INSERT, status forced to menunggu_review)'
insert into public.contents (id, campaign_creator_id, platform, draft_url, review_status) values ('44444444-0000-0000-0000-0000000000e1','44444444-0000-0000-0000-0000000000d1','tiktok','https://drive.test/draf-1','disetujui');
select review_status, revision_count from public.contents where id='44444444-0000-0000-0000-0000000000e1';
\echo 'P3-2. fill posted URL before approval (expect contents_posted_requires_approval)'
savepoint a; update public.contents set posted_url='https://tiktok.com/@x/1', posted_at=now(), live_status='tayang' where id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint a;
\echo 'P3-3. revision without notes (expect content_reviews_revision_notes_check)'
savepoint b; insert into public.content_reviews (content_id, decision, notes) values ('44444444-0000-0000-0000-0000000000e1','revisi','  '); rollback to savepoint b;
\echo 'P3-4. approve without the paid-label item (expect CHECKLIST_INCOMPLETE)'
savepoint c; insert into public.content_reviews (content_id, decision, checklist) values ('44444444-0000-0000-0000-0000000000e1','disetujui','{"sesuai_brief":true,"tanpa_larangan":true,"info_akurat":true}'); rollback to savepoint c;
\echo 'P3-5. set status directly (expect INVALID_REVIEW_TRANSITION)'
savepoint d; update public.contents set review_status='disetujui' where id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint d;
\echo 'P3-6. request a revision with notes (expect revisi)'
insert into public.content_reviews (content_id, decision, notes) values ('44444444-0000-0000-0000-0000000000e1','revisi','Tambahkan label berbayar di awal video.');
select review_status from public.contents where id='44444444-0000-0000-0000-0000000000e1';
\echo 'P3-7. edit the draft without resubmitting (expect DRAFT_FROZEN)'
savepoint e; update public.contents set draft_url='https://drive.test/diam-diam' where id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint e;
\echo 'P3-8. submit a new draft (expect menunggu_review, revision 1)'
update public.contents set draft_url='https://drive.test/draf-2', review_status='menunggu_review', revision_count=revision_count+1 where id='44444444-0000-0000-0000-0000000000e1';
select review_status, revision_count from public.contents where id='44444444-0000-0000-0000-0000000000e1';
\echo 'P3-9. approve with the full checklist (expect disetujui, snapshot of draf-2)'
insert into public.content_reviews (content_id, decision, checklist) values ('44444444-0000-0000-0000-0000000000e1','disetujui','{"sesuai_brief":true,"tanpa_larangan":true,"label_berbayar":true,"info_akurat":true}');
select c.review_status, r.draft_snapshot->>'draft_url' as reviewed_draft, r.reviewer_id is not null as has_reviewer from public.contents c join public.content_reviews r on r.content_id=c.id and r.decision='disetujui' where c.id='44444444-0000-0000-0000-0000000000e1';
\echo 'P3-10. review again (expect REVIEW_NOT_PENDING)'
savepoint f; insert into public.content_reviews (content_id, decision, notes) values ('44444444-0000-0000-0000-0000000000e1','ditolak','x'); rollback to savepoint f;
\echo 'P3-11. go live (expect tayang), then remove before posting time (expect contents_removed_check)'
update public.contents set posted_url='https://tiktok.com/@x/1', posted_at='2026-10-05 10:00+08', live_status='tayang' where id='44444444-0000-0000-0000-0000000000e1';
select live_status from public.contents where id='44444444-0000-0000-0000-0000000000e1';
savepoint g; update public.contents set live_status='dihapus', removed_at='2026-10-04 10:00+08' where id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint g;
\echo 'P3-12. delete reviewed content (expect foreign key violation)'
savepoint h; delete from public.contents where id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint h;
reset role;
\echo 'P3-13. change or delete a review even as superuser (expect REVIEW_IMMUTABLE twice)'
savepoint i; update public.content_reviews set notes='diubah' where content_id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint i;
savepoint j; delete from public.content_reviews where content_id='44444444-0000-0000-0000-0000000000e1'; rollback to savepoint j;
rollback;

\set QUIET on
delete from public.campaigns where id='44444444-0000-0000-0000-0000000000c1';
delete from public.creators where id='44444444-0000-0000-0000-0000000000a1';
delete from public.clients where id='44444444-0000-0000-0000-000000000001';
