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

-- ---------------------------------------------------------------------------
-- Phase 5: payouts and client payments (PRD M8, 8.3)
-- ---------------------------------------------------------------------------
begin;
\set QUIET on
insert into public.clients (id, name, type, province) values ('66666666-0000-0000-0000-000000000001','Finance Client','kampus_swasta','Kalimantan Selatan');
insert into public.creators (id, full_name, birth_date, province, status) values ('66666666-0000-0000-0000-0000000000a1','Finance C','1995-01-01','Kalimantan Selatan','terverifikasi');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status) values ('66666666-0000-0000-0000-0000000000c1','66666666-0000-0000-0000-000000000001','FIN-2026-01','Finance','awareness','2026-10-01','2026-10-31','aktif');
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug) values ('66666666-0000-0000-0000-0000000000d1','66666666-0000-0000-0000-0000000000c1','66666666-0000-0000-0000-0000000000a1','FNCABC','finance-c');
\set QUIET off
create temporary table p5_roles on commit drop as
  select (select id from public.profiles where role='manager' limit 1) as manager_id,
         (select id from public.profiles where role='owner' limit 1) as owner_id;
grant select on p5_roles to authenticated;

select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p5_roles),'role','authenticated')::text, true);
set local role authenticated;

\echo 'P5-1. payout while the campaign is still aktif (expect PAYOUT_NEEDS_CLOSED_CAMPAIGN)'
savepoint a; insert into public.payouts (campaign_creator_id, base_amount, total_amount) values ('66666666-0000-0000-0000-0000000000d1', 250000, 250000); rollback to savepoint a;
reset role;
update public.campaigns set status='selesai' where id='66666666-0000-0000-0000-0000000000c1';
set local role authenticated;
\echo 'P5-2. manager calculates a draft (expect INSERT, status draf)'
insert into public.payouts (id, campaign_creator_id, base_amount, views_bonus, total_amount, status) values ('66666666-0000-0000-0000-0000000000f1','66666666-0000-0000-0000-0000000000d1', 250000, 105000, 355000, 'dibayar');
select status, total_amount from public.payouts where id='66666666-0000-0000-0000-0000000000f1';
\echo 'P5-3. adjustment without a reason (expect payouts_adjustment_reason_check)'
savepoint b; update public.payouts set adjustment_amount=-50000, total_amount=305000 where id='66666666-0000-0000-0000-0000000000f1'; rollback to savepoint b;
\echo 'P5-4. manager approves (expect PAYOUT_OWNER_ONLY)'
savepoint c; update public.payouts set status='disetujui' where id='66666666-0000-0000-0000-0000000000f1'; rollback to savepoint c;
\echo 'P5-5. owner approves (expect disetujui with approver)'
select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from p5_roles),'role','authenticated')::text, true);
update public.payouts set status='disetujui' where id='66666666-0000-0000-0000-0000000000f1';
select status, approved_by is not null as has_approver from public.payouts where id='66666666-0000-0000-0000-0000000000f1';
\echo 'P5-6. recalculating an approved payout, even as owner (expect PAYOUT_LOCKED)'
savepoint d; update public.payouts set base_amount=500000, total_amount=605000 where id='66666666-0000-0000-0000-0000000000f1'; rollback to savepoint d;
\echo 'P5-7. mark paid without transfer proof (expect payouts_paid_check)'
savepoint e; update public.payouts set status='dibayar', paid_at='2026-11-05' where id='66666666-0000-0000-0000-0000000000f1'; rollback to savepoint e;
\echo 'P5-8. mark paid with date and proof (expect dibayar)'
update public.payouts set status='dibayar', paid_at='2026-11-05', transfer_proof_path='66666666-0000-0000-0000-0000000000c1/transfer.png' where id='66666666-0000-0000-0000-0000000000f1';
select status from public.payouts where id='66666666-0000-0000-0000-0000000000f1';
\echo 'P5-9. reopen a paid payout (expect INVALID_PAYOUT_TRANSITION)'
savepoint f; update public.payouts set status='draf' where id='66666666-0000-0000-0000-0000000000f1'; rollback to savepoint f;
select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p5_roles),'role','authenticated')::text, true);
\echo 'P5-10. manager attaches a client payment proof (expect FINANCE_OWNER_ONLY)'
savepoint g; insert into public.client_payments (campaign_id, invoice_number, amount, due_date, proof_path) values ('66666666-0000-0000-0000-0000000000c1','INV-FIN-1',15000000,'2026-11-15','x/proof.pdf'); rollback to savepoint g;
\echo 'P5-11. invoice status follows the paid amount (expect belum_dibayar, sebagian, lunas)'
insert into public.client_payments (id, campaign_id, invoice_number, amount, due_date, status) values ('66666666-0000-0000-0000-0000000000b1','66666666-0000-0000-0000-0000000000c1','INV-FIN-1',15000000,'2026-11-15','lunas');
select status from public.client_payments where id='66666666-0000-0000-0000-0000000000b1';
update public.client_payments set paid_amount=5000000, paid_at='2026-11-10' where id='66666666-0000-0000-0000-0000000000b1';
select status from public.client_payments where id='66666666-0000-0000-0000-0000000000b1';
update public.client_payments set paid_amount=15000000 where id='66666666-0000-0000-0000-0000000000b1';
select status from public.client_payments where id='66666666-0000-0000-0000-0000000000b1';
\echo 'P5-12. paid amount without a payment date (expect client_payments_paid_at_check)'
savepoint h; insert into public.client_payments (campaign_id, invoice_number, amount, due_date, paid_amount) values ('66666666-0000-0000-0000-0000000000c1','INV-FIN-2',1000000,'2026-11-15',1000); rollback to savepoint h;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 6: operational time logs (PRD M12)
-- ---------------------------------------------------------------------------
begin;
\set QUIET on
insert into public.clients (id, name, type, province) values ('77777777-0000-0000-0000-000000000001','Ops Client','kampus_swasta','Kalimantan Selatan');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status) values ('77777777-0000-0000-0000-0000000000c1','77777777-0000-0000-0000-000000000001','OPS-2026-01','Ops','awareness','2026-10-01','2026-10-31','selesai');
\set QUIET off
create temporary table p6_roles on commit drop as
  select (select id from public.profiles where role='manager' limit 1) as manager_id,
         (select id from public.profiles where role='owner' limit 1) as owner_id;
grant select on p6_roles to authenticated;

select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p6_roles),'role','authenticated')::text, true);
set local role authenticated;
\echo 'P6-1. manager logs time on a closed campaign (expect INSERT, user_id = manager)'
insert into public.ops_time_logs (id, campaign_id, activity, minutes, log_date) values ('77777777-0000-0000-0000-0000000000e1','77777777-0000-0000-0000-0000000000c1','laporan',45,'2026-11-01');
select activity, minutes, user_id = (select manager_id from p6_roles) as own from public.ops_time_logs where id='77777777-0000-0000-0000-0000000000e1';
\echo 'P6-2. manager logs time for someone else (expect RLS violation)'
savepoint a; insert into public.ops_time_logs (campaign_id, user_id, activity, minutes, log_date) values ('77777777-0000-0000-0000-0000000000c1',(select owner_id from p6_roles),'review',30,'2026-11-01'); rollback to savepoint a;
\echo 'P6-3. zero or over a day of minutes (expect ops_time_logs_minutes_check twice)'
savepoint b; insert into public.ops_time_logs (campaign_id, activity, minutes, log_date) values ('77777777-0000-0000-0000-0000000000c1','review',0,'2026-11-01'); rollback to savepoint b;
savepoint c; insert into public.ops_time_logs (campaign_id, activity, minutes, log_date) values ('77777777-0000-0000-0000-0000000000c1','review',1441,'2026-11-01'); rollback to savepoint c;
reset role;
insert into public.ops_time_logs (id, campaign_id, user_id, activity, minutes, log_date) values ('77777777-0000-0000-0000-0000000000e2','77777777-0000-0000-0000-0000000000c1',(select owner_id from p6_roles),'review',60,'2026-11-01');
set local role authenticated;
\echo 'P6-4. manager edits and deletes the owner''s entry (expect UPDATE 0, DELETE 0)'
update public.ops_time_logs set minutes=10 where id='77777777-0000-0000-0000-0000000000e2';
delete from public.ops_time_logs where id='77777777-0000-0000-0000-0000000000e2';
select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from p6_roles),'role','authenticated')::text, true);
\echo 'P6-5. owner edits the manager''s entry (expect UPDATE 1)'
update public.ops_time_logs set minutes=50 where id='77777777-0000-0000-0000-0000000000e1';
\echo 'P6-6. owner reassigns an entry to themselves (expect OPS_LOG_OWNER_FIXED)'
savepoint d; update public.ops_time_logs set user_id=(select owner_id from p6_roles) where id='77777777-0000-0000-0000-0000000000e1'; rollback to savepoint d;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 7: creator anonymization (PRD section 9)
-- ---------------------------------------------------------------------------
begin;
\set QUIET on
insert into public.creators (id, full_name, stage_name, phone_wa, email, birth_date, province, status, notes) values ('88888888-0000-0000-0000-0000000000a1','Anon Target','anon.target','081234567890','anon@example.com','1995-01-01','Kalimantan Selatan','aktif','catatan pribadi');
insert into public.creator_social_accounts (creator_id, platform, handle, audience_proof_path) values ('88888888-0000-0000-0000-0000000000a1','tiktok','anon.target.test','88888888-0000-0000-0000-0000000000a1/proof.png');
insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder) values ('88888888-0000-0000-0000-0000000000a1','Bank Kalsel','9876543210','Anon Target');
insert into public.activity_logs (actor_id, entity_type, entity_id, action, details) values ((select id from public.profiles where role='owner' limit 1),'creator','88888888-0000-0000-0000-0000000000a1','create','{"full_name":"Anon Target","status":"aktif"}');
\set QUIET off
create temporary table p7_roles on commit drop as
  select (select id from public.profiles where role='manager' limit 1) as manager_id,
         (select id from public.profiles where role='owner' limit 1) as owner_id;
grant select on p7_roles to authenticated;

select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p7_roles),'role','authenticated')::text, true);
set local role authenticated;
\echo 'P7-1. manager anonymizes a creator (expect OWNER_ONLY)'
savepoint a; select public.anonymize_creator('88888888-0000-0000-0000-0000000000a1'); rollback to savepoint a;
select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from p7_roles),'role','authenticated')::text, true);
\echo 'P7-2. owner anonymizes (expect the proof path returned)'
select public.anonymize_creator('88888888-0000-0000-0000-0000000000a1') as proof_paths;
reset role;
\echo 'P7-3. personal data erased, accounts removed, log scrubbed (expect anonymous name, empty contact, null birth date, diblokir, 0, 0, no full_name)'
select full_name, stage_name, phone_wa = '' and email = '' and notes = '' as contact_erased, birth_date, status, anonymized_at is not null as anonymized
  from public.creators where id='88888888-0000-0000-0000-0000000000a1';
select (select count(*) from public.creator_social_accounts where creator_id='88888888-0000-0000-0000-0000000000a1') as social,
       (select count(*) from public.creator_bank_accounts where creator_id='88888888-0000-0000-0000-0000000000a1') as bank,
       (select details from public.activity_logs where entity_id='88888888-0000-0000-0000-0000000000a1' limit 1) as log_details;
set local role authenticated;
\echo 'P7-4. editing an anonymized creator (expect CREATOR_ANONYMIZED)'
savepoint b; update public.creators set full_name='Nama Baru' where id='88888888-0000-0000-0000-0000000000a1'; rollback to savepoint b;
\echo 'P7-5. adding a bank account again (expect CREATOR_ANONYMIZED)'
savepoint c; insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder) values ('88888888-0000-0000-0000-0000000000a1','Bank X','1234567','X'); rollback to savepoint c;
\echo 'P7-6. anonymizing twice (expect CREATOR_ANONYMIZED)'
savepoint d; select public.anonymize_creator('88888888-0000-0000-0000-0000000000a1'); rollback to savepoint d;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 8 (v1.1): client report links (PRD FR-M9-05)
-- ---------------------------------------------------------------------------
begin;
\set QUIET on
insert into public.clients (id, name, type, province) values ('99999999-0000-0000-0000-000000000001','Share Client','kampus_swasta','Kalimantan Selatan');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status) values
 ('99999999-0000-0000-0000-0000000000c1','99999999-0000-0000-0000-000000000001','SHARE-2026-01','Share done','awareness','2026-10-01','2026-10-31','selesai'),
 ('99999999-0000-0000-0000-0000000000c2','99999999-0000-0000-0000-000000000001','SHARE-2026-02','Share draft','awareness','2026-10-01','2026-10-31','draft'),
 ('99999999-0000-0000-0000-0000000000c3','99999999-0000-0000-0000-000000000001','SHARE-2026-03','Share live','awareness','2026-10-01','2026-10-31','aktif');
\set QUIET off
create temporary table p8_roles on commit drop as
  select (select id from public.profiles where role='manager' limit 1) as manager_id,
         (select id from public.profiles where role='owner' limit 1) as owner_id;
grant select on p8_roles to authenticated;

select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p8_roles),'role','authenticated')::text, true);
set local role authenticated;
\echo 'P8-1. link for a draft campaign (expect SHARE_LINK_CAMPAIGN_STATUS)'
savepoint a; insert into public.report_share_links (campaign_id, token_hash) values ('99999999-0000-0000-0000-0000000000c2', repeat('a',64)); rollback to savepoint a;
\echo 'P8-2. manager shares a closed campaign (expect INSERT, created_by = manager)'
insert into public.report_share_links (id, campaign_id, token_hash) values ('99999999-0000-0000-0000-0000000000e1','99999999-0000-0000-0000-0000000000c1', repeat('b',64));
select created_by = (select manager_id from p8_roles) as own, view_count from public.report_share_links where id='99999999-0000-0000-0000-0000000000e1';
\echo 'P8-3. a second open link for the same campaign (expect unique violation report_share_links_one_open_idx)'
savepoint b; insert into public.report_share_links (campaign_id, token_hash) values ('99999999-0000-0000-0000-0000000000c1', repeat('c',64)); rollback to savepoint b;
\echo 'P8-4. changing the expiry (expect SHARE_LINK_FIXED)'
savepoint c; update public.report_share_links set expires_at = now() + interval '1 day' where id='99999999-0000-0000-0000-0000000000e1'; rollback to savepoint c;
\echo 'P8-5. a member inflates the view counter (expect SHARE_LINK_FIXED)'
savepoint d; update public.report_share_links set view_count = 99 where id='99999999-0000-0000-0000-0000000000e1'; rollback to savepoint d;
\echo 'P8-6. calling the public resolver as a member (expect permission denied)'
savepoint e; select public.open_report_share_link(repeat('b',64)); rollback to savepoint e;
\echo 'P8-7. deleting a link (expect DELETE 0)'
delete from public.report_share_links where id='99999999-0000-0000-0000-0000000000e1';
reset role;
\echo 'P8-8. service path opens the link and counts the view (expect campaign c1, then 1)'
select set_config('request.jwt.claims', '', true) is not null as claims_cleared;
select public.open_report_share_link(repeat('b',64)) as campaign_id;
select view_count, last_viewed_at is not null as viewed from public.report_share_links where id='99999999-0000-0000-0000-0000000000e1';
\echo 'P8-9. unknown token and expired link (expect null twice)'
insert into public.report_share_links (campaign_id, token_hash, created_by, created_at, expires_at) values ('99999999-0000-0000-0000-0000000000c3', repeat('d',64), (select owner_id from p8_roles), now() - interval '10 days', now() - interval '1 day');
select public.open_report_share_link(repeat('0',64)) as unknown, public.open_report_share_link(repeat('d',64)) as expired;
select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from p8_roles),'role','authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
\echo 'P8-10. owner revokes, naming someone else (expect UPDATE 1, revoked_by = owner)'
update public.report_share_links set revoked_at = now(), revoked_by = (select manager_id from p8_roles) where id='99999999-0000-0000-0000-0000000000e1';
select revoked_by = (select owner_id from p8_roles) as revoked_by_owner from public.report_share_links where id='99999999-0000-0000-0000-0000000000e1';
\echo 'P8-11. restoring a revoked link (expect SHARE_LINK_REVOKED)'
savepoint f; update public.report_share_links set revoked_at = null, revoked_by = null where id='99999999-0000-0000-0000-0000000000e1'; rollback to savepoint f;
reset role;
select set_config('request.jwt.claims', '', true) is not null as claims_cleared;
\echo 'P8-12. revoked link and cancelled campaign (expect null twice)'
insert into public.report_share_links (campaign_id, token_hash, created_by) values ('99999999-0000-0000-0000-0000000000c1', repeat('e',64), (select owner_id from p8_roles));
update public.campaigns set status = 'dibatalkan' where id='99999999-0000-0000-0000-0000000000c1';
select public.open_report_share_link(repeat('b',64)) as revoked, public.open_report_share_link(repeat('e',64)) as cancelled;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 9 (v2.0): creator portal access (PRD M13)
-- ---------------------------------------------------------------------------
begin;
create temporary table p9_roles on commit drop as
select
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id,
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  '88888888-0000-0000-0000-0000000000f1'::uuid as creator_user_id;

-- The account is created the way an invitation creates it: `handle_new_user`
-- turns the auth user into a profile with the role from its app_metadata
-- (Phase 15: user_metadata.role is ignored).
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '88888888-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'guard.portal@example.test',
  jsonb_build_object('role', 'creator'),
  jsonb_build_object('full_name', 'Guard Portal Creator'),
  now(),
  now()
);
insert into public.creators (id, full_name, birth_date, province, status, profile_id) values
 ('88888888-0000-0000-0000-0000000000a1','Portal C','1995-01-01','Kalimantan Selatan','terverifikasi','88888888-0000-0000-0000-0000000000f1'),
 ('88888888-0000-0000-0000-0000000000a2','Other C','1995-01-01','Kalimantan Selatan','terverifikasi',null);
insert into public.clients (id, name, type, province) values ('88888888-0000-0000-0000-000000000001','Portal Client','kampus_swasta','Kalimantan Selatan');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, package_price, landing_url) values
 ('88888888-0000-0000-0000-0000000000c1','88888888-0000-0000-0000-000000000001','PORTAL-2026-01','Portal','awareness','2026-10-01','2026-10-31','aktif', 9000000, 'https://pmb.example.ac.id/daftar'),
 ('88888888-0000-0000-0000-0000000000c2','88888888-0000-0000-0000-000000000001','PORTAL-2026-02','Draft','awareness','2026-10-01','2026-10-31','draft', 5000000, null);
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug) values
 ('88888888-0000-0000-0000-0000000000b1','88888888-0000-0000-0000-0000000000c1','88888888-0000-0000-0000-0000000000a1','PRTLAA','portal-a'),
 ('88888888-0000-0000-0000-0000000000b2','88888888-0000-0000-0000-0000000000c1','88888888-0000-0000-0000-0000000000a2','PRTLBB','portal-b'),
 ('88888888-0000-0000-0000-0000000000b3','88888888-0000-0000-0000-0000000000c2','88888888-0000-0000-0000-0000000000a1','PRTLCC','portal-c');

select set_config('request.jwt.claims', json_build_object('sub',(select creator_user_id from p9_roles),'role','authenticated')::text, true) is not null as creator_claims;
set local role authenticated;
\echo 'P9-1. is_active_member() and current_creator_id() for a creator (expect f, then the creator id)'
select public.is_active_member() as internal_member, public.current_creator_id() = '88888888-0000-0000-0000-0000000000a1' as own_creator;
\echo 'P9-2. the portal only shows the creator''s own assignment on a launched campaign (expect 1 row: PORTAL-2026-01 / PRTLAA)'
select campaign_code, referral_code, client_name from public.creator_portal_assignments;
\echo 'P9-3. the view carries no package price (expect column "package_price" does not exist)'
savepoint a; select package_price from public.creator_portal_assignments; rollback to savepoint a;
\echo 'P9-4. internal tables stay empty for a creator (expect 0 / 0 / 0 / 0)'
select
  (select count(*) from public.campaigns) as campaigns,
  (select count(*) from public.creators) as creators,
  (select count(*) from public.creator_bank_accounts) as bank_accounts,
  (select count(*) from public.payouts) as payouts;
\echo 'P9-5. creator grants themselves portal access (expect UPDATE 0: no policy on creators)'
update public.creators set profile_id = '88888888-0000-0000-0000-0000000000f1' where id='88888888-0000-0000-0000-0000000000a2';
reset role;

\echo 'P9-6. the team links an account (expect UPDATE 1)'
select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p9_roles),'role','authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
update public.creators set portal_invited_at = now() where id='88888888-0000-0000-0000-0000000000a1';
reset role;

\echo 'P9-7. anonymizing removes the portal account (expect profile_id null and the auth user gone)'
select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from p9_roles),'role','authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
select public.anonymize_creator('88888888-0000-0000-0000-0000000000a1') is not null as anonymized;
reset role;
select
  (select profile_id is null from public.creators where id='88888888-0000-0000-0000-0000000000a1') as unlinked,
  (select count(*) from public.profiles where id='88888888-0000-0000-0000-0000000000f1') as profile_rows;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 10 (v2.0): what a creator may send from the portal (PRD M13)
-- ---------------------------------------------------------------------------
begin;
create temporary table p10_roles on commit drop as
select
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id,
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  '77777777-0000-0000-0000-0000000000f1'::uuid as creator_user_id;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '77777777-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'guard.portal10@example.test',
  jsonb_build_object('role', 'creator'),
  jsonb_build_object('full_name', 'Guard Portal Creator 10'),
  now(),
  now()
);
insert into public.creators (id, full_name, birth_date, province, status, profile_id) values
 ('77777777-0000-0000-0000-0000000000a1','Portal C10','1995-01-01','Kalimantan Selatan','aktif','77777777-0000-0000-0000-0000000000f1'),
 ('77777777-0000-0000-0000-0000000000a2','Other C10','1995-01-01','Kalimantan Selatan','aktif',null);
insert into public.clients (id, name, type, province) values ('77777777-0000-0000-0000-000000000001','Portal Client 10','kampus_swasta','Kalimantan Selatan');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, landing_url) values
 ('77777777-0000-0000-0000-0000000000c1','77777777-0000-0000-0000-000000000001','PORTAL10-2026-01','Portal 10','awareness','2026-10-01','2026-10-31','aktif', null);
-- Phase 14 gates the portal on a confirmed assignment, so this creator has
-- already confirmed; the confirmation itself is exercised in Phase 14.
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug, status) values
 ('77777777-0000-0000-0000-0000000000b1','77777777-0000-0000-0000-0000000000c1','77777777-0000-0000-0000-0000000000a1','PRTLTA','portal10-a','bergabung'),
 ('77777777-0000-0000-0000-0000000000b2','77777777-0000-0000-0000-0000000000c1','77777777-0000-0000-0000-0000000000a2','PRTLTB','portal10-b','bergabung');
-- One approved, live content of the portal creator; one still waiting.
insert into public.contents (id, campaign_creator_id, platform, draft_url, review_status, posted_url, posted_at, live_status) values
 ('77777777-0000-0000-0000-0000000000d1','77777777-0000-0000-0000-0000000000b1','tiktok','https://example.com/d1','disetujui','https://example.com/live', now() - interval '2 days','tayang'),
 ('77777777-0000-0000-0000-0000000000d2','77777777-0000-0000-0000-0000000000b1','instagram','https://example.com/d2','disetujui', null, null,'belum_tayang');

select set_config('request.jwt.claims', json_build_object('sub','77777777-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as creator_claims;
set local role authenticated;
\echo 'P10-1. creator sends a draft for another creator (expect RLS violation)'
savepoint a; insert into public.contents (campaign_creator_id, platform, draft_url) values ('77777777-0000-0000-0000-0000000000b2','tiktok','https://example.com/x'); rollback to savepoint a;
\echo 'P10-2. creator sends their own draft (expect INSERT 1, waiting for review)'
insert into public.contents (id, campaign_creator_id, platform, draft_url, caption_draft) values ('77777777-0000-0000-0000-0000000000d3','77777777-0000-0000-0000-0000000000b1','tiktok','https://example.com/d3','Draf dari portal');
select review_status, live_status, posted_url is null as no_live_url from public.contents where id='77777777-0000-0000-0000-0000000000d3';
\echo 'P10-3. creator marks their own content live (expect PORTAL_FIELD_LOCKED)'
savepoint b; update public.contents set posted_url='https://example.com/self', posted_at=now(), live_status='tayang' where id='77777777-0000-0000-0000-0000000000d2'; rollback to savepoint b;
\echo 'P10-4. creator approves their own content (expect a rejected transition)'
savepoint c; update public.contents set review_status='disetujui' where id='77777777-0000-0000-0000-0000000000d3'; rollback to savepoint c;
\echo 'P10-5. creator reports it live instead (expect UPDATE 1, still belum_tayang)'
update public.contents set proposed_posted_url='https://example.com/proposed', proposed_posted_at=now() where id='77777777-0000-0000-0000-0000000000d2';
select live_status, proposed_at is not null as stamped from public.contents where id='77777777-0000-0000-0000-0000000000d2';
\echo 'P10-6. metrics for content that is not live (expect SUBMISSION_NEEDS_LIVE_CONTENT)'
savepoint d; insert into public.metric_submissions (content_id, checkpoint, captured_at, proof_path) values ('77777777-0000-0000-0000-0000000000d2','H+1', now(), 'x/p.png'); rollback to savepoint d;
\echo 'P10-7. captured before the content went live (expect SUBMISSION_BEFORE_POSTING)'
savepoint e; insert into public.metric_submissions (content_id, checkpoint, captured_at, proof_path) values ('77777777-0000-0000-0000-0000000000d1','H+1', now() - interval '5 days', 'x/p.png'); rollback to savepoint e;
\echo 'P10-8. a valid submission (expect INSERT 1, status menunggu)'
insert into public.metric_submissions (id, content_id, checkpoint, captured_at, views, proof_path) values ('77777777-0000-0000-0000-0000000000e1','77777777-0000-0000-0000-0000000000d1','H+1', now() - interval '1 day', 4200, 'x/p.png');
select status, submitted_by = '77777777-0000-0000-0000-0000000000f1' as own from public.metric_submissions where id='77777777-0000-0000-0000-0000000000e1';
\echo 'P10-9. creator verifies their own submission (expect SUBMISSION_INTERNAL_ONLY)'
savepoint f; select public.review_metric_submission('77777777-0000-0000-0000-0000000000e1', true, ''); rollback to savepoint f;
\echo 'P10-10. the numbers are not official yet (expect 0 snapshots)'
reset role;
select count(*) as snapshots from public.metric_snapshots where content_id='77777777-0000-0000-0000-0000000000d1';

select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p10_roles),'role','authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P10-11. team rejects without a reason (expect SUBMISSION_REJECT_NEEDS_NOTES)'
savepoint g; select public.review_metric_submission('77777777-0000-0000-0000-0000000000e1', false, '   '); rollback to savepoint g;
\echo 'P10-12. team accepts (expect a snapshot id, then status diterima and 1 snapshot)'
select public.review_metric_submission('77777777-0000-0000-0000-0000000000e1', true, '') is not null as snapshot_created;
select status, snapshot_id is not null as linked from public.metric_submissions where id='77777777-0000-0000-0000-0000000000e1';
select count(*) as snapshots, max(views) as views from public.metric_snapshots where content_id='77777777-0000-0000-0000-0000000000d1';
\echo 'P10-13. verifying it twice (expect SUBMISSION_NOT_PENDING)'
savepoint h; select public.review_metric_submission('77777777-0000-0000-0000-0000000000e1', false, 'berubah pikiran'); rollback to savepoint h;
\echo 'P10-14. team edits the queue by hand (expect UPDATE 0: no update policy)'
update public.metric_submissions set views = 99999 where id='77777777-0000-0000-0000-0000000000e1';
reset role;

select set_config('request.jwt.claims', json_build_object('sub','77777777-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as creator_claims;
set local role authenticated;
\echo 'P10-15. creator withdraws a verified submission (expect DELETE 0)'
delete from public.metric_submissions where id='77777777-0000-0000-0000-0000000000e1';
\echo 'P10-16. creator withdraws an open one (expect DELETE 1)'
insert into public.metric_submissions (id, content_id, checkpoint, captured_at, proof_path) values ('77777777-0000-0000-0000-0000000000e2','77777777-0000-0000-0000-0000000000d1','H+3', now(), 'x/p2.png');
delete from public.metric_submissions where id='77777777-0000-0000-0000-0000000000e2';
\echo 'P10-17. creator answers a revision request (expect UPDATE 1, back to review)'
reset role;
-- The team reviews it first, with the team's own claims.
select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p10_roles),'role','authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
insert into public.content_reviews (content_id, decision, notes) values ('77777777-0000-0000-0000-0000000000d3', 'revisi', 'Tambahkan label berbayar.');
reset role;
select set_config('request.jwt.claims', json_build_object('sub','77777777-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as creator_claims;
set local role authenticated;
update public.contents
  set draft_url = 'https://example.com/d3-revisi',
      review_status = 'menunggu_review',
      revision_count = revision_count + 1
  where id = '77777777-0000-0000-0000-0000000000d3';
select review_status, revision_count from public.contents where id='77777777-0000-0000-0000-0000000000d3';
\echo 'P10-18. creator reads another creator''s content or fee (expect 0 / 0)'
select
  (select count(*) from public.contents where campaign_creator_id='77777777-0000-0000-0000-0000000000b2') as other_contents,
  (select count(*) from public.creator_portal_payouts) as own_payouts;
reset role;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 11 (v3.0): client portal access and monitoring (PRD M14)
-- ---------------------------------------------------------------------------
begin;
create temporary table p11_roles on commit drop as
select
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id,
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  '66666666-0000-0000-0000-0000000000f1'::uuid as client_user_id;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '66666666-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'guard.klien@example.test',
  jsonb_build_object('role', 'client'),
  jsonb_build_object('full_name', 'Guard Portal Client'),
  now(),
  now()
);
insert into public.clients (id, name, type, province) values
 ('66666666-0000-0000-0000-000000000001','Klien Portal','kampus_swasta','Kalimantan Selatan'),
 ('66666666-0000-0000-0000-000000000002','Klien Lain','umkm','Kalimantan Selatan');
insert into public.client_contacts (id, client_id, name, email, is_primary, profile_id) values
 ('66666666-0000-0000-0000-0000000000e1','66666666-0000-0000-0000-000000000001','Kontak Portal','kontak@example.test', true, '66666666-0000-0000-0000-0000000000f1'),
 ('66666666-0000-0000-0000-0000000000e2','66666666-0000-0000-0000-000000000002','Kontak Lain','lain@example.test', true, null);
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, package_price) values
 ('66666666-0000-0000-0000-0000000000c1','66666666-0000-0000-0000-000000000001','KLIEN-2026-01','Kampanye Klien','awareness','2026-10-01','2026-10-31','aktif', 12000000),
 ('66666666-0000-0000-0000-0000000000c2','66666666-0000-0000-0000-000000000001','KLIEN-2026-02','Masih Draft','awareness','2026-10-01','2026-10-31','draft', 5000000),
 ('66666666-0000-0000-0000-0000000000c3','66666666-0000-0000-0000-000000000002','KLIEN-2026-03','Kampanye Lain','awareness','2026-10-01','2026-10-31','aktif', 7000000);

select set_config('request.jwt.claims', json_build_object('sub','66666666-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as client_claims;
set local role authenticated;
\echo 'P11-1. is_active_member() and current_client_id() for a client (expect f, then the client id)'
select public.is_active_member() as internal_member, public.current_client_id() = '66666666-0000-0000-0000-000000000001' as own_client;
\echo 'P11-2. the portal lists only the client''s own running campaign (expect 1 row: KLIEN-2026-01)'
select code, name from public.client_portal_campaigns;
\echo 'P11-3. the view carries no package price (expect column "package_price" does not exist)'
savepoint a; select package_price from public.client_portal_campaigns; rollback to savepoint a;
\echo 'P11-4. internal tables stay empty for a client (expect 0 / 0 / 0 / 0)'
select
  (select count(*) from public.campaigns) as campaigns,
  (select count(*) from public.creators) as creators,
  (select count(*) from public.payouts) as payouts,
  (select count(*) from public.client_payments) as client_payments;
\echo 'P11-5. client moves their own account to another contact (expect UPDATE 0)'
update public.client_contacts set profile_id = '66666666-0000-0000-0000-0000000000f1' where id='66666666-0000-0000-0000-0000000000e2';
reset role;

\echo 'P11-6. the team records an invitation (expect UPDATE 1)'
select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p11_roles),'role','authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
update public.client_contacts set portal_invited_at = now() where id='66666666-0000-0000-0000-0000000000e1';
reset role;

\echo 'P11-7. access withdrawn by the owner closes the portal (expect null and 0 rows)'
-- Only an owner may flip is_active (protect_profile_privileges), which is why
-- setClientPortalAccessAction is owner-only too.
select set_config('request.jwt.claims', json_build_object('sub',(select owner_id from p11_roles),'role','authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
update public.profiles set is_active = false where id='66666666-0000-0000-0000-0000000000f1';
reset role;
select set_config('request.jwt.claims', json_build_object('sub','66666666-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as client_claims;
set local role authenticated;
select public.current_client_id() as client_id, (select count(*) from public.client_portal_campaigns) as campaigns;
reset role;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 14 (v3.2): the creator confirms their own assignment (PRD M13:
-- FR-M13-10)
-- ---------------------------------------------------------------------------
begin;
create temporary table p14_roles on commit drop as
select
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  '55555555-0000-0000-0000-0000000000f1'::uuid as creator_user_id;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '55555555-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'guard.portal14@example.test',
  jsonb_build_object('role', 'creator'),
  jsonb_build_object('full_name', 'Guard Portal Creator 14'),
  now(),
  now()
);
insert into public.creators (id, full_name, birth_date, province, status, profile_id) values
 ('55555555-0000-0000-0000-0000000000a1','Portal C14','1995-01-01','Kalimantan Selatan','aktif','55555555-0000-0000-0000-0000000000f1'),
 ('55555555-0000-0000-0000-0000000000a2','Other C14','1995-01-01','Kalimantan Selatan','aktif',null);
insert into public.clients (id, name, type, province) values ('55555555-0000-0000-0000-000000000001','Portal Client 14','kampus_swasta','Kalimantan Selatan');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, landing_url) values
 ('55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-000000000001','PORTAL14-2026-01','Portal 14','awareness','2026-10-01','2026-10-31','aktif', null);
-- Both assignments start as the team creates them: invited, unconfirmed.
insert into public.campaign_creators (id, campaign_id, creator_id, referral_code, tracking_slug, base_fee) values
 ('55555555-0000-0000-0000-0000000000b1','55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-0000000000a1','PRTLFA','portal14-a', 1500000),
 ('55555555-0000-0000-0000-0000000000b2','55555555-0000-0000-0000-0000000000c1','55555555-0000-0000-0000-0000000000a2','PRTLFB','portal14-b', 1500000);
-- Content the team entered for the unconfirmed assignment, so the metric gate
-- has something live to aim at.
insert into public.contents (id, campaign_creator_id, platform, draft_url, review_status, posted_url, posted_at, live_status) values
 ('55555555-0000-0000-0000-0000000000d1','55555555-0000-0000-0000-0000000000b1','tiktok','https://example.com/d1','disetujui','https://example.com/live', now() - interval '2 days','tayang');

select set_config('request.jwt.claims', json_build_object('sub','55555555-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as creator_claims;
set local role authenticated;
\echo 'P14-1. the brief is readable before confirming (expect 1 row, status diundang, no confirmation)'
select status, creator_confirmed_at is null as unconfirmed from public.creator_portal_assignments where id='55555555-0000-0000-0000-0000000000b1';
\echo 'P14-2. creator sends a draft before confirming (expect RLS violation)'
savepoint a; insert into public.contents (campaign_creator_id, platform, draft_url) values ('55555555-0000-0000-0000-0000000000b1','tiktok','https://example.com/early'); rollback to savepoint a;
\echo 'P14-3. creator sends metric evidence before confirming (expect RLS violation)'
savepoint b; insert into public.metric_submissions (content_id, checkpoint, captured_at, proof_path) values ('55555555-0000-0000-0000-0000000000d1','H+1', now() - interval '1 day', 'x/p.png'); rollback to savepoint b;
\echo 'P14-4. creator raises their own fee while confirming (expect PORTAL_FIELD_LOCKED)'
savepoint c; update public.campaign_creators set status='bergabung', base_fee=9000000 where id='55555555-0000-0000-0000-0000000000b1'; rollback to savepoint c;
\echo 'P14-5. creator marks the assignment finished (expect PORTAL_CONFIRM_ONLY)'
savepoint d; update public.campaign_creators set status='selesai' where id='55555555-0000-0000-0000-0000000000b1'; rollback to savepoint d;
\echo 'P14-6. creator confirms someone else''s assignment (expect UPDATE 0)'
update public.campaign_creators set status='bergabung' where id='55555555-0000-0000-0000-0000000000b2';
\echo 'P14-7. creator confirms their own (expect UPDATE 1, then bergabung with both stamps set)'
update public.campaign_creators set status='bergabung' where id='55555555-0000-0000-0000-0000000000b1';
select status, creator_confirmed_at is not null as confirmed, joined_at is not null as joined
  from public.campaign_creators where id='55555555-0000-0000-0000-0000000000b1';
\echo 'P14-8. confirming twice (expect PORTAL_CONFIRM_ONLY)'
savepoint e; update public.campaign_creators set status='bergabung' where id='55555555-0000-0000-0000-0000000000b1'; rollback to savepoint e;
\echo 'P14-9. the draft goes through now (expect INSERT 1)'
insert into public.contents (id, campaign_creator_id, platform, draft_url) values ('55555555-0000-0000-0000-0000000000d2','55555555-0000-0000-0000-0000000000b1','tiktok','https://example.com/after');
\echo 'P14-10. and so does the metric evidence (expect INSERT 1)'
insert into public.metric_submissions (content_id, checkpoint, captured_at, proof_path) values ('55555555-0000-0000-0000-0000000000d1','H+1', now() - interval '1 day', 'x/p.png');
reset role;

\echo 'P14-11. the team still edits the assignment freely (expect UPDATE 1, fee changed)'
select set_config('request.jwt.claims', json_build_object('sub',(select manager_id from p14_roles),'role','authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
update public.campaign_creators set base_fee = 2000000, contents_committed = 3 where id='55555555-0000-0000-0000-0000000000b1';
select base_fee, contents_committed from public.campaign_creators where id='55555555-0000-0000-0000-0000000000b1';
\echo 'P14-12. the team wraps the assignment up (expect UPDATE 1, selesai)'
update public.campaign_creators set status = 'selesai' where id='55555555-0000-0000-0000-0000000000b1';
select status from public.campaign_creators where id='55555555-0000-0000-0000-0000000000b1';
reset role;

\echo 'P14-13. a wrapped-up assignment still takes metric evidence (expect INSERT 1)'
select set_config('request.jwt.claims', json_build_object('sub','55555555-0000-0000-0000-0000000000f1','role','authenticated')::text, true) is not null as creator_claims;
set local role authenticated;
insert into public.metric_submissions (content_id, checkpoint, captured_at, proof_path) values ('55555555-0000-0000-0000-0000000000d1','H+3', now() - interval '1 day', 'x/p3.png');
reset role;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 15 (v4.0): klipper self-registration (PRD M16, FR-M3-03..09)
-- ---------------------------------------------------------------------------
begin;
create temporary table p15_roles on commit drop as
select
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id,
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id;

\echo 'P15-1. sign-up that claims role owner in user_metadata (expect creator / prospek / mandiri / t / t / t)'
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '15151515-0000-0000-0000-0000000000f1',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'guard.signup@example.test',
  '{"provider": "email"}'::jsonb,
  jsonb_build_object(
    'role', 'owner', 'signup', 'mandiri', 'full_name', 'Guard Signup', 'stage_name', 'guardsignup',
    'birth_date', '2000-01-01', 'phone_wa', '6281515150001', 'city', 'Banjarmasin',
    'province', 'Kalimantan Selatan', 'terms_version', '2026-10'
  ),
  now(),
  now()
);
select p.role, c.status, c.signup_source, c.verification_code ~ '^KB-[A-HJ-NP-Z2-9]{6}$' as code_ok,
       c.terms_agreed_at is not null as terms_recorded,
       exists (select 1 from public.activity_logs a where a.entity_id = c.id and a.action = 'self_signup') as logged
from public.profiles p join public.creators c on c.profile_id = p.id
where p.id = '15151515-0000-0000-0000-0000000000f1';

\echo 'P15-2. sign-up claiming role manager without klipper data (expect creator / 0)'
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('15151515-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'guard.bare@example.test', '{}'::jsonb, '{"role": "manager"}'::jsonb, now(), now());
select role, (select count(*) from public.creators where profile_id = '15151515-0000-0000-0000-0000000000f2') as creator_rows
from public.profiles where id = '15151515-0000-0000-0000-0000000000f2';

\echo 'P15-3. under-18 sign-up (expect creators_adult_check)'
savepoint a;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('15151515-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'guard.young@example.test', '{}'::jsonb,
  jsonb_build_object('signup', 'mandiri', 'full_name', 'Young', 'stage_name', 'young', 'birth_date', (current_date - interval '17 years')::date,
    'phone_wa', '6281515150003', 'city', 'Banjarmasin', 'province', 'Kalimantan Selatan', 'terms_version', '2026-10'),
  now(), now());
rollback to savepoint a;

\echo 'P15-4. sign-up with a WhatsApp number already registered (expect SIGNUP_INVALID, number not echoed)'
savepoint b;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('15151515-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'guard.dup@example.test', '{}'::jsonb,
  jsonb_build_object('signup', 'mandiri', 'full_name', 'Dup', 'stage_name', 'dup', 'birth_date', '2000-01-01',
    'phone_wa', '6281515150001', 'city', 'Banjarmasin', 'province', 'Kalimantan Selatan', 'terms_version', '2026-10'),
  now(), now());
rollback to savepoint b;

\echo 'P15-5. sign-up with a malformed WhatsApp number (expect SIGNUP_INVALID)'
savepoint c;
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('15151515-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'guard.badphone@example.test', '{}'::jsonb,
  jsonb_build_object('signup', 'mandiri', 'full_name', 'Bad', 'stage_name', 'bad', 'birth_date', '2000-01-01',
    'phone_wa', '12345', 'city', 'Banjarmasin', 'province', 'Kalimantan Selatan', 'terms_version', '2026-10'),
  now(), now());
rollback to savepoint c;

-- A second klipper, so cross-account writes have a target.
insert into public.creators (id, full_name, birth_date, province, status) values
  ('15151515-0000-0000-0000-0000000000a2', 'Other Klipper', '1995-01-01', 'Kalimantan Selatan', 'aktif');
insert into public.creator_social_accounts (id, creator_id, platform, handle) values
  ('15151515-0000-0000-0000-0000000000e2', '15151515-0000-0000-0000-0000000000a2', 'tiktok', 'guard.other');

select set_config('request.jwt.claims', json_build_object('sub', '15151515-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_claims;
set local role authenticated;
\echo 'P15-6. klipper stamps their own account as verified (expect PORTAL_FIELD_LOCKED)'
savepoint d;
insert into public.creator_social_accounts (creator_id, platform, handle, last_verified_at)
select id, 'tiktok', 'guard.self', now() from public.creator_portal_profile;
rollback to savepoint d;
\echo 'P15-7. klipper adds their first account (expect INSERT 0 1, then aktif)'
insert into public.creator_social_accounts (id, creator_id, platform, handle)
select '15151515-0000-0000-0000-0000000000e1', id, 'tiktok', 'guard.self' from public.creator_portal_profile;
select status from public.creator_portal_profile;
\echo 'P15-8. klipper edits another klipper account (expect UPDATE 0)'
update public.creator_social_accounts set followers_count = 1 where id = '15151515-0000-0000-0000-0000000000e2';
\echo 'P15-9. klipper reads the internal creators table (expect 0)'
select count(*) as creators_visible from public.creators;
\echo 'P15-10. klipper asks for account deletion (expect t)'
select public.request_creator_account_deletion();
select deletion_requested_at is not null as requested from public.creator_portal_profile;
reset role;

\echo 'P15-11. the team verifies the account; a new audience claim withdraws it (expect t, then f)'
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p15_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
update public.creator_social_accounts set kalimantan_audience_pct = 70, last_verified_at = now() where id = '15151515-0000-0000-0000-0000000000e1';
select last_verified_at is not null as verified from public.creator_social_accounts where id = '15151515-0000-0000-0000-0000000000e1';
reset role;
select set_config('request.jwt.claims', json_build_object('sub', '15151515-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_claims;
set local role authenticated;
update public.creator_social_accounts set kalimantan_audience_pct = 90 where id = '15151515-0000-0000-0000-0000000000e1';
select last_verified_at is not null as still_verified from public.creator_portal_social_accounts where id = '15151515-0000-0000-0000-0000000000e1';
reset role;

\echo 'P15-12. manager blocks without a reason (expect creators_blocked_reason_check)'
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p15_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
savepoint e; update public.creators set status = 'diblokir' where id = '15151515-0000-0000-0000-0000000000a2'; rollback to savepoint e;
\echo 'P15-13. manager blocks with a reason (expect diblokir / t)'
update public.creators set status = 'diblokir', blocked_reason = 'Views palsu terbukti' where id = '15151515-0000-0000-0000-0000000000a2';
select status, blocked_at is not null as stamped from public.creators where id = '15151515-0000-0000-0000-0000000000a2';
\echo 'P15-14. manager unblocks (expect OWNER_ONLY)'
savepoint f; update public.creators set status = 'aktif' where id = '15151515-0000-0000-0000-0000000000a2'; rollback to savepoint f;
reset role;
\echo 'P15-15. owner unblocks (expect aktif / t)'
select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p15_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
update public.creators set status = 'aktif' where id = '15151515-0000-0000-0000-0000000000a2';
select status, blocked_at is null and blocked_reason is null as cleared from public.creators where id = '15151515-0000-0000-0000-0000000000a2';
reset role;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;
