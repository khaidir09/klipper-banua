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

-- ---------------------------------------------------------------------------
-- Phase 4: metric snapshots and registrant reports (PRD M7, 8.5)
-- ---------------------------------------------------------------------------
-- Fixtures live inside this transaction: reviews are immutable, so the final
-- rollback is the only way to remove them again.
begin;
\set QUIET on
insert into public.clients (id, name, type, province) values ('55555555-0000-0000-0000-000000000001','Metric Client','kampus_swasta','Kalimantan Selatan');
insert into public.creators (id, full_name, birth_date, province, status) values ('55555555-0000-0000-0000-0000000000a1','Metric C','1995-01-01','Kalimantan Selatan','terverifikasi');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date) values ('55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-000000000001','METRIC-2026-01','Metric','awareness','2026-10-01','2026-10-31');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date) values ('55555555-0000-0000-0000-0000000000c2','55555555-0000-0000-0000-000000000001','METRIC-2026-02','Other','awareness','2026-10-01','2026-10-31');
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug) values ('55555555-0000-0000-0000-0000000000d1','55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-0000000000a1','MTRABC','metric-c');
insert into public.contents (id, campaign_creator_id, platform, draft_url) values ('55555555-0000-0000-0000-0000000000e1','55555555-0000-0000-0000-0000000000d1','tiktok','https://drive.test/a');
insert into public.contents (id, campaign_creator_id, platform, draft_url) values ('55555555-0000-0000-0000-0000000000e2','55555555-0000-0000-0000-0000000000d1','tiktok','https://drive.test/b');
insert into public.content_reviews (content_id, decision, checklist) values ('55555555-0000-0000-0000-0000000000e1','disetujui','{"sesuai_brief":true,"tanpa_larangan":true,"label_berbayar":true,"info_akurat":true}');
update public.contents set posted_url='https://tiktok.com/@m/1', posted_at='2026-10-05 10:00+08', live_status='tayang' where id='55555555-0000-0000-0000-0000000000e1';
\set QUIET off

select set_config('request.jwt.claims', json_build_object('sub',(select id from public.profiles where role='manager' limit 1),'role','authenticated')::text, true);
set local role authenticated;

\echo 'P4-1. snapshot for content that is not live (expect SNAPSHOT_NEEDS_LIVE_CONTENT)'
savepoint a; insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e2','H+1','2026-10-06 10:00+08',100,'x/p.png'); rollback to savepoint a;
\echo 'P4-2. snapshot captured before posting (expect SNAPSHOT_BEFORE_POSTING)'
savepoint b; insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e1','H+1','2026-10-05 09:00+08',100,'x/p.png'); rollback to savepoint b;
\echo 'P4-3. snapshot without proof (expect metric_snapshots_proof_check)'
savepoint c; insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e1','H+1','2026-10-06 10:00+08',100,' '); rollback to savepoint c;
\echo 'P4-4. valid H+1 snapshot, then a second H+1 (expect INSERT, then unique violation)'
insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e1','H+1','2026-10-06 10:00+08',1200,'x/p.png');
savepoint d; insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e1','H+1','2026-10-06 12:00+08',1300,'x/p.png'); rollback to savepoint d;
\echo 'P4-5. two "lainnya" snapshots are allowed (expect INSERT twice)'
insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e1','lainnya','2026-10-07 10:00+08',1500,'x/p.png');
insert into public.metric_snapshots (content_id, checkpoint, captured_at, views, proof_path) values ('55555555-0000-0000-0000-0000000000e1','lainnya','2026-10-07 18:00+08',1600,'x/p.png');
\echo 'P4-6. report with a code from another campaign (expect REPORT_ASSIGNMENT_MISMATCH)'
savepoint e; insert into public.registrant_reports (campaign_id, campaign_creator_id, period_start, period_end, registrant_count) values ('55555555-0000-0000-0000-0000000000c2','55555555-0000-0000-0000-0000000000d1','2026-10-01','2026-10-07',3); rollback to savepoint e;
\echo 'P4-7. proof without the no-personal-data confirmation (expect registrant_reports_proof_confirmation_check)'
savepoint f; insert into public.registrant_reports (campaign_id, campaign_creator_id, period_start, period_end, registrant_count, proof_path) values ('55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-0000000000d1','2026-10-01','2026-10-07',3,'x/r.png'); rollback to savepoint f;
\echo 'P4-8. valid report by code and one without a code (expect INSERT twice)'
insert into public.registrant_reports (campaign_id, campaign_creator_id, period_start, period_end, registrant_count, proof_path, proof_confirmed_no_personal_data) values ('55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-0000000000d1','2026-10-01','2026-10-07',3,'x/r.png',true);
insert into public.registrant_reports (campaign_id, period_start, period_end, registrant_count) values ('55555555-0000-0000-0000-0000000000c1','2026-10-01','2026-10-07',2);
\echo 'P4-9. change the referral code after a report (expect TRACKING_FROZEN)'
savepoint g; update public.campaign_creators set referral_code='XYZWVU' where id='55555555-0000-0000-0000-0000000000d1'; rollback to savepoint g;
rollback;
