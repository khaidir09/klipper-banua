-- Phase 2 business-rule guards for campaigns and assignments. Run against the
-- LOCAL database only:  npm run db:guards-check
-- Every numbered step prints the error it is expected to raise (or the
-- successful result for step 5). Fixtures are removed at the end.

\set QUIET on
-- Fixtures as superuser.
insert into public.clients (id, name, type, province) values ('22222222-0000-0000-0000-000000000001','Guard Client','kampus_swasta','Kalimantan Selatan');
insert into public.creators (id, full_name, birth_date, province, status, blocked_reason) values
 ('22222222-0000-0000-0000-0000000000a1','Verified C','1995-01-01','Kalimantan Selatan','terverifikasi',null),
 ('22222222-0000-0000-0000-0000000000a2','Prospect C','1995-01-01','Kalimantan Selatan','prospek',null),
 ('22222222-0000-0000-0000-0000000000a3','Blocked C','1995-01-01','Kalimantan Selatan','diblokir','Guard fixture');
-- A legacy campaign (Phase 16: paket + undangan keep the v3.2 rules).
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, payout_model, access) values
 ('22222222-0000-0000-0000-0000000000c1','22222222-0000-0000-0000-000000000001','GUARD-2026-01','Guard','pendaftar','2026-10-01','2026-10-31','paket','undangan');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('44444444-0000-0000-0000-0000000000c1');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('55555555-0000-0000-0000-0000000000c1');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date) values ('55555555-0000-0000-0000-0000000000c2','55555555-0000-0000-0000-000000000001','METRIC-2026-02','Other','awareness','2026-10-01','2026-10-31');
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('55555555-0000-0000-0000-0000000000c2');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('66666666-0000-0000-0000-0000000000c1');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('77777777-0000-0000-0000-0000000000c1');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('99999999-0000-0000-0000-0000000000c1', '99999999-0000-0000-0000-0000000000c2', '99999999-0000-0000-0000-0000000000c3');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('88888888-0000-0000-0000-0000000000c1', '88888888-0000-0000-0000-0000000000c2');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('77777777-0000-0000-0000-0000000000c1');
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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('66666666-0000-0000-0000-0000000000c1', '66666666-0000-0000-0000-0000000000c2', '66666666-0000-0000-0000-0000000000c3');

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
-- Legacy flow (Phase 16): package campaigns keep the v3.2 rules.
update public.campaigns set payout_model = 'paket', access = 'undangan' where id in ('55555555-0000-0000-0000-0000000000c1');
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
\echo 'P15-16. owner erases the klipper who asked for deletion (expect diblokir / t / t / 0)'
select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p15_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
select public.anonymize_creator(c.id) is not null as erased
from public.creators c where c.profile_id = '15151515-0000-0000-0000-0000000000f1';
reset role;
select c.status, c.anonymized_at is not null as anonymized, c.blocked_reason <> '' as has_reason,
       (select count(*) from auth.users where id = '15151515-0000-0000-0000-0000000000f1') as auth_users
from public.creators c where c.full_name like 'Kreator anonim %' and c.signup_source = 'mandiri' and c.deletion_requested_at is not null;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 16 (v4.0): open campaigns and the catalog (PRD M17, FR-M4-02, FR-M5-01)
-- ---------------------------------------------------------------------------
begin;
create temporary table p16_roles on commit drop as
select
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id;

-- Portal accounts, created the way an invitation creates them.
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
       jsonb_build_object('role', 'creator'), '{}'::jsonb, now(), now()
from (values
  ('16161616-0000-0000-0000-0000000000f1'::uuid, 'guard.p16.active@example.test'),
  ('16161616-0000-0000-0000-0000000000f2'::uuid, 'guard.p16.prospect@example.test'),
  ('16161616-0000-0000-0000-0000000000f3'::uuid, 'guard.p16.oldterms@example.test'),
  ('16161616-0000-0000-0000-0000000000f4'::uuid, 'guard.p16.local@example.test'),
  ('16161616-0000-0000-0000-0000000000f6'::uuid, 'guard.p16.blocked@example.test')
) as u(id, email);

insert into public.creators (id, full_name, stage_name, birth_date, province, status, terms_version, terms_agreed_at, verified_at, profile_id) values
 ('16161616-0000-0000-0000-0000000000a1','Active K','Aktif Klipper','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),null,'16161616-0000-0000-0000-0000000000f1'),
 ('16161616-0000-0000-0000-0000000000a2','Prospect K','prospek','1995-01-01','Kalimantan Selatan','prospek','2026-10',now(),null,'16161616-0000-0000-0000-0000000000f2'),
 ('16161616-0000-0000-0000-0000000000a3','Old Terms K','lama','1995-01-01','Kalimantan Selatan','aktif','v1',now(),null,'16161616-0000-0000-0000-0000000000f3'),
 ('16161616-0000-0000-0000-0000000000a4','Local K','lokal','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),now(),'16161616-0000-0000-0000-0000000000f4'),
 ('16161616-0000-0000-0000-0000000000a5','No Account K','tanpa akun','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),null,null),
 ('16161616-0000-0000-0000-0000000000a6','Blocked K','blokir','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),null,'16161616-0000-0000-0000-0000000000f6');
insert into public.clients (id, name, type, province) values ('16161616-0000-0000-0000-000000000001','Open Client 16','kampus_swasta','Kalimantan Selatan');

-- c1 a draft to activate step by step; c2 open; c3 local only; c4 past its
-- end; c5 invite-only; c6 a legacy package campaign.
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, access, payout_model,
                              brief, rate_per_1000_views, creator_budget, allowed_platforms, local_only) values
 ('16161616-0000-0000-0000-0000000000c1','16161616-0000-0000-0000-000000000001','OPEN16-01','Draft 16','awareness', public.campaign_today(), public.campaign_today() + 30,'draft','terbuka','per_views','',0,0,'{}',false),
 ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-000000000001','OPEN16-02','Open 16','awareness', public.campaign_today(), public.campaign_today() + 30,'aktif','terbuka','per_views','Brief',10000,5000000,'{tiktok}',false),
 ('16161616-0000-0000-0000-0000000000c3','16161616-0000-0000-0000-000000000001','OPEN16-03','Local 16','awareness', public.campaign_today(), public.campaign_today() + 30,'aktif','terbuka','per_views','Brief',10000,5000000,'{tiktok}',true),
 ('16161616-0000-0000-0000-0000000000c4','16161616-0000-0000-0000-000000000001','OPEN16-04','Ended 16','awareness', public.campaign_today() - 30, public.campaign_today() - 1,'aktif','terbuka','per_views','Brief',10000,5000000,'{tiktok}',false),
 ('16161616-0000-0000-0000-0000000000c5','16161616-0000-0000-0000-000000000001','OPEN16-05','Invite 16','awareness', public.campaign_today(), public.campaign_today() + 30,'aktif','undangan','per_views','Brief',10000,5000000,'{tiktok}',false),
 ('16161616-0000-0000-0000-0000000000c6','16161616-0000-0000-0000-000000000001','OPEN16-06','Paket 16','awareness', public.campaign_today(), public.campaign_today() + 30,'aktif','undangan','paket','Brief',0,0,'{}',false);
insert into public.campaign_assets (campaign_id, title, type, external_url) values
 ('16161616-0000-0000-0000-0000000000c5','Undangan saja','tautan','https://drive.example.test/u');

select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p16_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P16-1. the team creates a paket campaign (expect PAKET_RETIRED)'
savepoint a; insert into public.campaigns (client_id, code, name, objective, start_date, end_date, payout_model, access) values ('16161616-0000-0000-0000-000000000001','OPEN16-99','x','awareness','2026-10-01','2026-10-31','paket','undangan'); rollback to savepoint a;
\echo 'P16-2. activate with an empty brief (expect ACTIVATION_NEEDS_BRIEF)'
savepoint b; update public.campaigns set status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint b;
update public.campaigns set brief='Potong video wisuda' where id='16161616-0000-0000-0000-0000000000c1';
\echo 'P16-3. activate without material (expect ACTIVATION_NEEDS_ASSET)'
savepoint c; update public.campaigns set status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint c;
insert into public.campaign_assets (campaign_id, title, type, external_url) values ('16161616-0000-0000-0000-0000000000c1','Video mentah','tautan','https://drive.example.test/v');
\echo 'P16-4. activate without a rate (expect ACTIVATION_NEEDS_RATE)'
savepoint d; update public.campaigns set status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint d;
update public.campaigns set rate_per_1000_views=10000 where id='16161616-0000-0000-0000-0000000000c1';
\echo 'P16-5. activate without a budget (expect ACTIVATION_NEEDS_BUDGET)'
savepoint e; update public.campaigns set status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint e;
update public.campaigns set creator_budget=5000000 where id='16161616-0000-0000-0000-0000000000c1';
\echo 'P16-6. activate without a platform (expect ACTIVATION_NEEDS_PLATFORM)'
savepoint f; update public.campaigns set status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint f;
update public.campaigns set allowed_platforms='{tiktok,instagram}' where id='16161616-0000-0000-0000-0000000000c1';
\echo 'P16-7. activate after the end date (expect ACTIVATION_PAST_END_DATE)'
savepoint g; update public.campaigns set start_date=public.campaign_today() - 10, end_date=public.campaign_today() - 1, status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint g;
\echo 'P16-8. an invite-only per_views campaign still needs a klipper (expect ACTIVATION_NEEDS_CREATOR)'
savepoint h; update public.campaigns set access='undangan', status='aktif' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint h;
\echo 'P16-9. an open campaign starts without klippers (expect aktif / t)'
update public.campaigns set status='aktif' where id='16161616-0000-0000-0000-0000000000c1';
select status, published_at is not null as published from public.campaigns where id='16161616-0000-0000-0000-0000000000c1';
\echo 'P16-10. switching an active campaign to paket (expect PAKET_RETIRED)'
savepoint i; update public.campaigns set payout_model='paket', access='undangan' where id='16161616-0000-0000-0000-0000000000c1'; rollback to savepoint i;
\echo 'P16-11. switching an active paket campaign to per_views (expect PAYOUT_MODEL_LOCKED)'
savepoint j; update public.campaigns set payout_model='per_views' where id='16161616-0000-0000-0000-0000000000c6'; rollback to savepoint j;
\echo 'P16-12. the team raises the budget of a running campaign (expect UPDATE 1)'
update public.campaigns set creator_budget=6000000 where id='16161616-0000-0000-0000-0000000000c2';
reset role;

-- The active klipper (a1).
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_claims;
set local role authenticated;
\echo 'P16-13. the catalog lists only running open per_views campaigns (expect Draft 16, Local 16, Open 16; 100% each)'
select name, budget_remaining_pct, budget_exhausted from public.creator_portal_catalog where client_name = 'Open Client 16' order by name;
\echo 'P16-14. joining for another klipper (expect PORTAL_FIELD_LOCKED)'
savepoint k; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a5'); rollback to savepoint k;
\echo 'P16-15. joining with a fee of their own (expect PORTAL_FIELD_LOCKED)'
savepoint l; insert into public.campaign_creators (campaign_id, creator_id, base_fee) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a1', 1000000); rollback to savepoint l;
\echo 'P16-16. joining an invite-only campaign (expect JOIN_CAMPAIGN_CLOSED)'
savepoint m; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c5','16161616-0000-0000-0000-0000000000a1'); rollback to savepoint m;
\echo 'P16-17. joining a paket campaign (expect JOIN_CAMPAIGN_CLOSED)'
savepoint m2; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c6','16161616-0000-0000-0000-0000000000a1'); rollback to savepoint m2;
\echo 'P16-18. joining after the end date (expect JOIN_PAST_DEADLINE)'
savepoint n; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c4','16161616-0000-0000-0000-0000000000a1'); rollback to savepoint n;
\echo 'P16-19. joining a local-only campaign without the badge (expect JOIN_LOCAL_ONLY)'
savepoint o; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c3','16161616-0000-0000-0000-0000000000a1'); rollback to savepoint o;
\echo 'P16-20. joining with a chosen code, slug and status (expect INSERT 0 1)'
insert into public.campaign_creators (campaign_id, creator_id, status, referral_code, tracking_slug, contents_committed)
values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a1','diundang','AAAAAA','my-own-slug', 99);
\echo 'P16-21. the server decided the row (expect bergabung / mandiri / t / t / t / t / 3 / t)'
select status, join_source, creator_confirmed_at is not null as confirmed, joined_at is not null as joined,
       referral_code <> 'AAAAAA' as code_generated, tracking_slug like 'aktif-klipper-%' as slug_generated,
       contents_committed, withdrawn_at is null as not_withdrawn
from public.creator_portal_assignments where campaign_id = '16161616-0000-0000-0000-0000000000c2';
\echo 'P16-22. joining twice (expect campaign_creators_campaign_creator_key)'
savepoint p; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a1'); rollback to savepoint p;
\echo 'P16-23. material of an open campaign is visible, of an invite-only one not (expect 1 / 0)'
select (select count(*) from public.creator_portal_assets where campaign_id = '16161616-0000-0000-0000-0000000000c1') as open_assets,
       (select count(*) from public.creator_portal_assets where campaign_id = '16161616-0000-0000-0000-0000000000c5') as invite_assets;
\echo 'P16-24. withdrawing (expect UPDATE 1, then mundur / t)'
update public.campaign_creators set status = 'mundur' where campaign_id = '16161616-0000-0000-0000-0000000000c2' and creator_id = '16161616-0000-0000-0000-0000000000a1';
select status, withdrawn_at is not null as withdrawn from public.creator_portal_assignments where campaign_id = '16161616-0000-0000-0000-0000000000c2';
\echo 'P16-25. rejoining after withdrawing (expect PORTAL_CONFIRM_ONLY)'
savepoint q; update public.campaign_creators set status = 'bergabung' where campaign_id = '16161616-0000-0000-0000-0000000000c2' and creator_id = '16161616-0000-0000-0000-0000000000a1'; rollback to savepoint q;
reset role;

\echo 'P16-26. withdrawing from a paket campaign (expect WITHDRAW_NOT_ALLOWED)'
-- Fixtures go in without a JWT, the way the service role writes them.
select set_config('request.jwt.claims', '', true) is not null as no_claims;
insert into public.campaign_creators (id, campaign_id, creator_id, status, referral_code, tracking_slug) values
 ('16161616-0000-0000-0000-0000000000b6','16161616-0000-0000-0000-0000000000c6','16161616-0000-0000-0000-0000000000a1','bergabung','PKTSXA','paket-sixteen');
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_claims;
set local role authenticated;
savepoint r; update public.campaign_creators set status = 'mundur' where id = '16161616-0000-0000-0000-0000000000b6'; rollback to savepoint r;
reset role;

-- The prospect (a2).
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f2', 'role', 'authenticated')::text, true) is not null as prospect_claims;
set local role authenticated;
\echo 'P16-27. a prospect reads the catalog but not the material (expect 3 / 0)'
select (select count(*) from public.creator_portal_catalog where client_name = 'Open Client 16') as catalog_rows,
       (select count(*) from public.creator_portal_assets where campaign_id = '16161616-0000-0000-0000-0000000000c1') as assets;
\echo 'P16-28. a prospect joins (expect JOIN_CREATOR_NOT_ACTIVE)'
savepoint s1; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a2'); rollback to savepoint s1;
reset role;

-- The klipper on an old version of the terms (a3).
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f3', 'role', 'authenticated')::text, true) is not null as old_terms_claims;
set local role authenticated;
\echo 'P16-29. joining on old terms (expect JOIN_TERMS_OUTDATED)'
savepoint t1; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a3'); rollback to savepoint t1;
\echo 'P16-30. accepting the current terms, then joining (expect 2026-10, then INSERT 0 1)'
select public.accept_creator_terms();
insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a3');
reset role;

\echo 'P16-31. an approved clip blocks withdrawing (expect WITHDRAW_HAS_APPROVED_CLIP)'
select set_config('request.jwt.claims', '', true) is not null as no_claims;
insert into public.contents (campaign_creator_id, platform, draft_url, review_status)
select id, 'tiktok', 'https://example.com/p16', 'disetujui' from public.campaign_creators
where campaign_id = '16161616-0000-0000-0000-0000000000c2' and creator_id = '16161616-0000-0000-0000-0000000000a3';
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f3', 'role', 'authenticated')::text, true) is not null as old_terms_claims;
set local role authenticated;
savepoint t2; update public.campaign_creators set status = 'mundur' where campaign_id = '16161616-0000-0000-0000-0000000000c2' and creator_id = '16161616-0000-0000-0000-0000000000a3'; rollback to savepoint t2;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p16_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P16-32. changing the rate after an approved clip (expect RATE_LOCKED)'
savepoint u; update public.campaigns set rate_per_1000_views = 12000 where id = '16161616-0000-0000-0000-0000000000c2'; rollback to savepoint u;
\echo 'P16-33. the team cuts the budget below the cost of 1,000 views (expect UPDATE 1, then t)'
update public.campaigns set creator_budget = 5000 where id = '16161616-0000-0000-0000-0000000000c2';
select public.campaign_budget_exhausted('16161616-0000-0000-0000-0000000000c2') as exhausted;
\echo 'P16-34. the team blocks a klipper (expect UPDATE 1)'
update public.creators set status = 'diblokir', blocked_reason = 'Uji blokir' where id = '16161616-0000-0000-0000-0000000000a6';
reset role;

-- The badge holder (a4).
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f4', 'role', 'authenticated')::text, true) is not null as local_claims;
set local role authenticated;
\echo 'P16-35. joining a campaign whose budget is used up (expect JOIN_BUDGET_EXHAUSTED)'
savepoint v; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c2','16161616-0000-0000-0000-0000000000a4'); rollback to savepoint v;
\echo 'P16-36. a badge holder joins a local-only campaign (expect INSERT 0 1)'
insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c3','16161616-0000-0000-0000-0000000000a4');
reset role;

-- The blocked klipper (a6).
select set_config('request.jwt.claims', json_build_object('sub', '16161616-0000-0000-0000-0000000000f6', 'role', 'authenticated')::text, true) is not null as blocked_claims;
set local role authenticated;
\echo 'P16-37. a blocked klipper reads the catalog, then joins (expect 0, then CREATOR_BLOCKED)'
select count(*) as catalog_rows from public.creator_portal_catalog;
savepoint w; insert into public.campaign_creators (campaign_id, creator_id) values ('16161616-0000-0000-0000-0000000000c1','16161616-0000-0000-0000-0000000000a6'); rollback to savepoint w;
reset role;

\echo 'P16-38. legacy assignments keep their model and team source (expect paket / tim)'
select c.payout_model, cc.join_source from public.campaign_creators cc join public.campaigns c on c.id = cc.campaign_id
where cc.id = '16161616-0000-0000-0000-0000000000b6';
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 17 (v4.0): clip submissions, verification and the honor ledger
-- (PRD M18, 8.6, FR-M19-01, FR-M19-02)
-- ---------------------------------------------------------------------------
begin;
create temporary table p17_roles on commit drop as
select
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
       jsonb_build_object('role', 'creator'), '{}'::jsonb, now(), now()
from (values
  ('17171717-0000-0000-0000-0000000000f1'::uuid, 'guard.p17.a@example.test'),
  ('17171717-0000-0000-0000-0000000000f2'::uuid, 'guard.p17.b@example.test')
) as u(id, email);

insert into public.creators (id, full_name, stage_name, birth_date, province, status, terms_version, terms_agreed_at, profile_id) values
 ('17171717-0000-0000-0000-0000000000a1','Klipper A','Klip A','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),'17171717-0000-0000-0000-0000000000f1'),
 ('17171717-0000-0000-0000-0000000000a2','Klipper B','Klip B','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),'17171717-0000-0000-0000-0000000000f2');
insert into public.creator_social_accounts (creator_id, platform, handle) values
 ('17171717-0000-0000-0000-0000000000a1','tiktok','guard_p17_a'),
 ('17171717-0000-0000-0000-0000000000a2','tiktok','guard_p17_b');
insert into public.clients (id, name, type, province) values ('17171717-0000-0000-0000-000000000001','Clip Client 17','kampus_swasta','Kalimantan Selatan');
-- Rp 10.000 per 1.000 views, Rp 400.000 budget, max 2 clips, 7 live days.
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, access, payout_model,
                              brief, rate_per_1000_views, creator_budget, min_views_to_earn, max_clips_per_creator,
                              allowed_platforms, min_live_days, claim_grace_days) values
 ('17171717-0000-0000-0000-0000000000c1','17171717-0000-0000-0000-000000000001','CLIP17-01','Clip 17','awareness',
  public.campaign_today() - 5, public.campaign_today() + 30,'aktif','terbuka','per_views','Brief',10000,400000,1000,2,
  '{tiktok,youtube}',7,3);
insert into public.campaign_creators (id, campaign_id, creator_id, status, join_source, joined_at, creator_confirmed_at) values
 ('17171717-0000-0000-0000-0000000000b1','17171717-0000-0000-0000-0000000000c1','17171717-0000-0000-0000-0000000000a1','bergabung','mandiri',now() - interval '3 days',now() - interval '3 days'),
 ('17171717-0000-0000-0000-0000000000b2','17171717-0000-0000-0000-0000000000c1','17171717-0000-0000-0000-0000000000a2','bergabung','mandiri',now() - interval '3 days',now() - interval '3 days');

-- Klipper A.
select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P17-1. allowed platform without a registered account (expect CLIP_NO_SOCIAL_ACCOUNT)'
savepoint a; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','youtube','https://youtube.com/shorts/p17yt',now() - interval '1 hour',5000,0,0,0,'x/p.png'); rollback to savepoint a;
\echo 'P17-2. platform the campaign does not allow (expect CLIP_PLATFORM_NOT_ALLOWED)'
savepoint b; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','instagram','https://instagram.com/reel/p17ig',now() - interval '1 hour',5000,0,0,0,'x/p.png'); rollback to savepoint b;
\echo 'P17-3. posted before joining (expect CLIP_OUTSIDE_PERIOD)'
savepoint c; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','https://tiktok.com/@a/video/1700',now() - interval '4 days',5000,0,0,0,'x/p.png'); rollback to savepoint c;
\echo 'P17-4. posted in the future (expect CLIP_POSTED_IN_FUTURE)'
savepoint d; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','https://tiktok.com/@a/video/1700',now() + interval '1 day',5000,0,0,0,'x/p.png'); rollback to savepoint d;
\echo 'P17-5. a clip without its views proof (expect CLIP_NEEDS_PROOF)'
savepoint e;
insert into public.contents (campaign_creator_id, platform, proposed_posted_url, proposed_posted_at, proposed_at)
values ('17171717-0000-0000-0000-0000000000b1','tiktok','https://tiktok.com/@a/video/1709',now() - interval '1 hour',now());
set constraints public.contents_clip_needs_submission immediate;
rollback to savepoint e;
\echo 'P17-6. a valid clip (expect menunggu_review / f / t / normalised URL / 1 open submission)'
select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','https://www.TikTok.com/@a/video/1701/?is_from_webapp=1',now() - interval '1 hour',23450,900,40,12,'17171717-0000-0000-0000-0000000000c1/p1.png') is not null as sent;
select review_status, posted_url is not null as live, proposed_posted_url is not null as proposed, posted_url_normalized,
       (select count(*) from public.metric_submissions s where s.content_id = c.id and s.status = 'menunggu') as open_submissions
from public.contents c where campaign_creator_id = '17171717-0000-0000-0000-0000000000b1';
\echo 'P17-7. the same video again with tracker parameters (expect contents_posted_url_normalized_key)'
savepoint f; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','http://tiktok.com/@A/video/1701?utm_source=copy&_t=x',now() - interval '1 hour',100,0,0,0,'x/p.png'); rollback to savepoint f;
\echo 'P17-8. a second clip, then a third over max_clips_per_creator (expect sent, then CLIP_LIMIT_REACHED)'
select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','https://tiktok.com/@a/video/1702',now() - interval '1 hour',23450,900,40,12,'17171717-0000-0000-0000-0000000000c1/p2.png') is not null as sent;
savepoint g; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','https://tiktok.com/@a/video/1703',now() - interval '1 hour',100,0,0,0,'x/p.png'); rollback to savepoint g;
\echo 'P17-9. changing the URL of a sent clip (expect CLIP_USE_VERIFY)'
savepoint h; update public.contents set proposed_posted_url = 'https://tiktok.com/@a/video/9999' where posted_url_normalized = 'https://tiktok.com/@a/video/1701'; rollback to savepoint h;
\echo 'P17-10. deleting the views proof of a clip (expect SUBMISSION_INITIAL_FIXED)'
savepoint i; delete from public.metric_submissions where content_id = (select id from public.contents where posted_url_normalized = 'https://tiktok.com/@a/video/1701'); rollback to savepoint i;
\echo 'P17-11. a views update before approval (expect VIEWS_UPDATE_NOT_ALLOWED)'
savepoint j; insert into public.metric_submissions (content_id, checkpoint, captured_at, views, proof_path)
select id, 'lainnya', now(), 30000, 'x/p.png' from public.contents where posted_url_normalized = 'https://tiktok.com/@a/video/1701'; rollback to savepoint j;
reset role;

-- Klipper B.
select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f2', 'role', 'authenticated')::text, true) is not null as klipper_b;
set local role authenticated;
\echo 'P17-12. another klipper claims the same video (expect contents_posted_url_normalized_key)'
savepoint k; select public.submit_clip('17171717-0000-0000-0000-0000000000b2','tiktok','https://m.tiktok.com/@a/video/1701#comments',now() - interval '1 hour',100,0,0,0,'x/p.png'); rollback to savepoint k;
\echo 'P17-13. B cannot see the clips of A (expect 0)'
select count(*) as visible from public.creator_portal_contents where campaign_creator_id = '17171717-0000-0000-0000-0000000000b1';
reset role;

create temporary table p17_clips on commit drop as
select
  (select id from public.contents where posted_url_normalized = 'https://tiktok.com/@a/video/1701') as clip1,
  (select id from public.contents where posted_url_normalized = 'https://tiktok.com/@a/video/1702') as clip2;
grant select on p17_clips to authenticated;

-- Manager.
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p17_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P17-14. the package review path on a clip (expect CLIP_USE_VERIFY)'
savepoint l; insert into public.content_reviews (content_id, decision, notes) select clip1, 'revisi', 'x' from p17_clips; rollback to savepoint l;
\echo 'P17-15. approve without the full checklist (expect CHECKLIST_INCOMPLETE)'
savepoint m; select public.verify_clip((select clip1 from p17_clips),'disetujui','{"kode_verifikasi":true}'::jsonb,'',null,23450,234500); rollback to savepoint m;
\echo 'P17-16. revision without notes (expect content_reviews_revision_notes_check)'
savepoint n; select public.verify_clip((select clip1 from p17_clips),'revisi','{}'::jsonb,'',null,null,0); rollback to savepoint n;
\echo 'P17-17. reject without a reason (expect CLIP_REJECT_NEEDS_REASON)'
savepoint o; select public.verify_clip((select clip1 from p17_clips),'ditolak','{}'::jsonb,'Bukan akun Anda',null,null,0); rollback to savepoint o;
\echo 'P17-18. a credit above what the verified views earn (expect CREDIT_ABOVE_CLIP_EARNING)'
savepoint p; select public.verify_clip((select clip1 from p17_clips),'disetujui',
  '{"kode_verifikasi":true,"akun_sesuai":true,"sesuai_brief":true,"tanpa_larangan":true,"hashtag":true,"label_berbayar":true,"dalam_periode":true,"views_cocok":true,"tanpa_views_palsu":true}'::jsonb,
  '',null,23450,300000); rollback to savepoint p;
\echo 'P17-19. approve clip 1 at 23.450 views (expect disetujui / tayang / t / 23450 / 23450 / 234500 / 234500)'
select public.verify_clip((select clip1 from p17_clips),'disetujui',
  '{"kode_verifikasi":true,"akun_sesuai":true,"sesuai_brief":true,"tanpa_larangan":true,"hashtag":true,"label_berbayar":true,"dalam_periode":true,"views_cocok":true,"tanpa_views_palsu":true}'::jsonb,
  'OK',null,23450,234500) is not null as reviewed;
select c.review_status, c.live_status, c.posted_url is not null as live, c.verified_views,
       (select views from public.metric_snapshots s where s.content_id = c.id) as snapshot_views,
       public.clip_credited_amount(c.id) as credited,
       public.campaign_creator_cost('17171717-0000-0000-0000-0000000000c1') as campaign_cost
from public.contents c where c.id = (select clip1 from p17_clips);
\echo 'P17-20. two approvals at once: clip 2 credit computed before clip 1 was credited (expect BUDGET_EXCEEDED)'
-- Both verifiers saw cost 0 and computed Rp 234.500 each. verify_clip locks
-- the campaign row, so the second one waits for the first and is re-checked
-- against it: 234.500 + 234.500 > 400.000.
savepoint q; select public.verify_clip((select clip2 from p17_clips),'disetujui',
  '{"kode_verifikasi":true,"akun_sesuai":true,"sesuai_brief":true,"tanpa_larangan":true,"hashtag":true,"label_berbayar":true,"dalam_periode":true,"views_cocok":true,"tanpa_views_palsu":true}'::jsonb,
  '',null,23450,234500); rollback to savepoint q;
\echo 'P17-21. clip 2 with the recomputed, budget-limited credit (expect 165500 / t / 400000 / t)'
select public.verify_clip((select clip2 from p17_clips),'disetujui',
  '{"kode_verifikasi":true,"akun_sesuai":true,"sesuai_brief":true,"tanpa_larangan":true,"hashtag":true,"label_berbayar":true,"dalam_periode":true,"views_cocok":true,"tanpa_views_palsu":true}'::jsonb,
  '',null,23450,165500,true) is not null as reviewed;
select public.clip_credited_amount((select clip2 from p17_clips)) as credited,
       (select credit_limited from public.metric_submissions where content_id = (select clip2 from p17_clips)) as limited,
       public.campaign_creator_cost('17171717-0000-0000-0000-0000000000c1') as campaign_cost,
       public.campaign_budget_exhausted('17171717-0000-0000-0000-0000000000c1') as exhausted;
\echo 'P17-22. the team edits a clip directly (expect CLIP_USE_VERIFY)'
savepoint r; update public.contents set live_status = 'dihapus', removed_at = now() where id = (select clip1 from p17_clips); rollback to savepoint r;
\echo 'P17-23. the team writes the ledger directly (expect LEDGER_FUNCTION_ONLY)'
savepoint s; insert into public.creator_ledger_entries (creator_id, entry_type, amount, campaign_id, content_id)
values ('17171717-0000-0000-0000-0000000000a1','honor_klip',1000000,'17171717-0000-0000-0000-0000000000c1',(select clip1 from p17_clips)); rollback to savepoint s;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f2', 'role', 'authenticated')::text, true) is not null as klipper_b;
set local role authenticated;
\echo 'P17-24. a new clip once the budget is used up (expect CLIP_BUDGET_EXHAUSTED)'
savepoint t; select public.submit_clip('17171717-0000-0000-0000-0000000000b2','tiktok','https://tiktok.com/@b/video/1704',now() - interval '1 hour',100,0,0,0,'x/p.png'); rollback to savepoint t;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P17-25. a views update within 24 hours (expect VIEWS_UPDATE_TOO_SOON)'
savepoint u; insert into public.metric_submissions (content_id, checkpoint, captured_at, views, proof_path)
select clip1, 'lainnya', now(), 41000, 'x/p.png' from p17_clips; rollback to savepoint u;
reset role;
select set_config('request.jwt.claims', '', true) is not null as no_claims;
update public.metric_submissions set created_at = created_at - interval '2 days' where content_id = (select clip1 from p17_clips);

select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P17-26. a views update after 24 hours (expect INSERT 0 1)'
insert into public.metric_submissions (content_id, checkpoint, captured_at, views, proof_path)
select clip1, 'H+1', now(), 41000, '17171717-0000-0000-0000-0000000000c1/p3.png' from p17_clips;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p17_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P17-27. accepted while the budget is used up: no credit (expect lainnya / 41000 / 234500 / 1)'
select public.verify_views_update((select id from public.metric_submissions where content_id = (select clip1 from p17_clips) and status = 'menunggu'), true, 41000, '', 0, true) is not null as accepted;
select (select checkpoint from public.metric_submissions where content_id = (select clip1 from p17_clips) order by created_at desc limit 1) as checkpoint,
       (select verified_views from public.contents where id = (select clip1 from p17_clips)) as verified,
       public.clip_credited_amount((select clip1 from p17_clips)) as credited,
       (select count(*) from public.creator_ledger_entries where content_id = (select clip1 from p17_clips)) as entries;
\echo 'P17-28. the team raises the budget (expect UPDATE 1)'
update public.campaigns set creator_budget = 800000 where id = '17171717-0000-0000-0000-0000000000c1';
reset role;
select set_config('request.jwt.claims', '', true) is not null as no_claims;
update public.metric_submissions set created_at = created_at - interval '2 days' where content_id = (select clip1 from p17_clips);
select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
insert into public.metric_submissions (content_id, checkpoint, captured_at, views, proof_path)
select clip1, 'lainnya', now(), 41000, '17171717-0000-0000-0000-0000000000c1/p4.png' from p17_clips;
reset role;
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p17_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P17-29. the next update only credits the difference (expect 410000 / 2 entries)'
select public.verify_views_update((select id from public.metric_submissions where content_id = (select clip1 from p17_clips) and status = 'menunggu'), true, 41000, '', 175500, false) is not null as accepted;
select public.clip_credited_amount((select clip1 from p17_clips)) as credited,
       (select count(*) from public.creator_ledger_entries where content_id = (select clip1 from p17_clips)) as entries;
\echo 'P17-30. clip 1 taken down before min_live_days (expect 410000, then dihapus / 0 / pembatalan -410000)'
select public.cancel_clip((select clip1 from p17_clips), 'dihapus', now());
select c.live_status, public.clip_credited_amount(c.id) as credited,
       (select entry_type || ' ' || amount from public.creator_ledger_entries e where e.content_id = c.id and e.entry_type = 'pembatalan') as cancellation
from public.contents c where c.id = (select clip1 from p17_clips);
\echo 'P17-31. a manager cancels a clip for fraud (expect OWNER_ONLY)'
savepoint v; select public.cancel_clip((select clip2 from p17_clips), 'kecurangan', null, 'views_tidak_wajar', 'Views dibeli'); rollback to savepoint v;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p17_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
\echo 'P17-32. the owner cancels clip 2 for fraud (expect 165500, then ditolak / f / views_tidak_wajar / 0)'
select public.cancel_clip((select clip2 from p17_clips), 'kecurangan', null, 'views_tidak_wajar', 'Views dibeli');
select review_status, posted_url is not null as live, rejection_reason, public.clip_credited_amount(id) as credited
from public.contents where id = (select clip2 from p17_clips);
reset role;

select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P17-33. A sends the rejected clip again (expect CLIP_URL_REJECTED_BEFORE)'
savepoint w; select public.submit_clip('17171717-0000-0000-0000-0000000000b1','tiktok','https://tiktok.com/@a/video/1702',now() - interval '1 hour',100,0,0,0,'x/p.png'); rollback to savepoint w;
\echo 'P17-34. A reads the outcome in the portal (expect dihapus disetujui 0 / belum_tayang ditolak 0 views_tidak_wajar)'
select live_status, review_status, earned_amount, rejection_reason from public.creator_portal_contents
where campaign_creator_id = '17171717-0000-0000-0000-0000000000b1' order by created_at;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f2', 'role', 'authenticated')::text, true) is not null as klipper_b;
set local role authenticated;
\echo 'P17-35. the real owner of a rejected video can still send it (expect sent)'
select public.submit_clip('17171717-0000-0000-0000-0000000000b2','tiktok','https://tiktok.com/@a/video/1702',now() - interval '1 hour',5000,0,0,0,'17171717-0000-0000-0000-0000000000c1/p5.png') is not null as sent;
reset role;
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p17_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P17-36. the team asks B for a revision (expect revisi)'
select public.verify_clip((select id from public.contents where campaign_creator_id = '17171717-0000-0000-0000-0000000000b2'),'revisi','{}'::jsonb,'Kode verifikasi belum ada di caption',null,null,0) is not null as reviewed;
select review_status from public.contents where campaign_creator_id = '17171717-0000-0000-0000-0000000000b2';
reset role;
select set_config('request.jwt.claims', json_build_object('sub', '17171717-0000-0000-0000-0000000000f2', 'role', 'authenticated')::text, true) is not null as klipper_b;
set local role authenticated;
\echo 'P17-37. B reads the note, then sends the clip again with the same URL (expect note, then menunggu_review / 1)'
select notes from public.creator_portal_reviews where content_id = (select id from public.creator_portal_contents where campaign_creator_id = '17171717-0000-0000-0000-0000000000b2');
update public.contents set review_status = 'menunggu_review', revision_count = revision_count + 1 where campaign_creator_id = '17171717-0000-0000-0000-0000000000b2';
select review_status, revision_count from public.creator_portal_contents where campaign_creator_id = '17171717-0000-0000-0000-0000000000b2';
\echo 'P17-38. B withdraws: the waiting clip is cancelled (expect UPDATE 1, then ditolak / lainnya / ditolak)'
update public.campaign_creators set status = 'mundur' where id = '17171717-0000-0000-0000-0000000000b2';
select c.review_status, c.rejection_reason, s.status as submission
from public.creator_portal_contents c join public.creator_portal_submissions s on s.content_id = c.id
where c.campaign_creator_id = '17171717-0000-0000-0000-0000000000b2';
reset role;

select set_config('request.jwt.claims', '', true) is not null as no_claims;
\echo 'P17-39. ledger entries cannot change, even as superuser (expect LEDGER_IMMUTABLE twice)'
savepoint x; update public.creator_ledger_entries set amount = 1 where campaign_id = '17171717-0000-0000-0000-0000000000c1'; rollback to savepoint x;
savepoint y; delete from public.creator_ledger_entries where campaign_id = '17171717-0000-0000-0000-0000000000c1'; rollback to savepoint y;
\echo 'P17-40. the database and the app normalise alike (expect https://youtube.com/watch?list=l&v=abc)'
select public.normalize_clip_url('https://m.YouTube.com/watch?v=AbC&si=zz&list=L&t=30#x') as normalised;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- Phase 18 (v4.0): balance, bank accounts and withdrawals (PRD M19, 8.7)
-- ---------------------------------------------------------------------------
begin;
create temporary table p18_roles on commit drop as
select
  (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id,
  (select id from public.profiles where role = 'owner' and is_active limit 1) as owner_id;
grant select on p18_roles to authenticated;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
       jsonb_build_object('role', 'creator'), '{}'::jsonb, now(), now()
from (values
  ('18181818-0000-0000-0000-0000000000f1'::uuid, 'guard.p18.a@example.test'),
  ('18181818-0000-0000-0000-0000000000f2'::uuid, 'guard.p18.b@example.test')
) as u(id, email);

insert into public.creators (id, full_name, stage_name, birth_date, province, status, terms_version, terms_agreed_at, profile_id) values
 ('18181818-0000-0000-0000-0000000000a1','Klipper Saldo A','saldo.a','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),'18181818-0000-0000-0000-0000000000f1'),
 ('18181818-0000-0000-0000-0000000000a2','Klipper Saldo B','saldo.b','1995-01-01','Kalimantan Selatan','aktif','2026-10',now(),'18181818-0000-0000-0000-0000000000f2');

-- The owner credits both klippers (stands in for approved clips).
select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p18_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
\echo 'P18-1. an adjustment without a reason (expect ADJUSTMENT_NEEDS_REASON)'
savepoint a; select public.adjust_balance('18181818-0000-0000-0000-0000000000a1', 300000, ' '); rollback to savepoint a;
select public.adjust_balance('18181818-0000-0000-0000-0000000000a1', 300000, 'Uji saldo') is not null as credited_a;
select public.adjust_balance('18181818-0000-0000-0000-0000000000a2', 200000, 'Uji saldo') is not null as credited_b;
\echo 'P18-2. the minimum can be changed by the owner, within bounds (expect check violation, then UPDATE 1)'
savepoint b; update public.platform_settings set min_withdrawal = 5000; rollback to savepoint b;
update public.platform_settings set min_withdrawal = 100000;
reset role;

-- Klipper A.
select set_config('request.jwt.claims', json_build_object('sub', '18181818-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P18-3. A reads the balance (expect 300000 / 300000 / 0 / 100000)'
select available, total_earned, total_withdrawn, min_withdrawal from public.creator_portal_balance;
\echo 'P18-4. a withdrawal without a bank account (expect WITHDRAW_NEEDS_BANK)'
savepoint c; select public.request_withdrawal(150000); rollback to savepoint c;
\echo 'P18-5. A saves a first account; case and spacing of the name do not matter (expect ******5678 / t / no hold)'
select public.save_creator_bank_account('Bank Kalsel', '0012-3456 78', 'klipper  saldo a') is not null as saved;
select bank_name, account_number_masked, holder_matches_name, hold_until is null as no_hold from public.creator_portal_bank_account;
\echo 'P18-6. A cannot read the base table (expect 0)'
select count(*) as rows from public.creator_bank_accounts;
\echo 'P18-7. below the minimum, above the balance (expect WITHDRAW_BELOW_MIN, WITHDRAW_ABOVE_BALANCE)'
savepoint d; select public.request_withdrawal(50000); rollback to savepoint d;
savepoint e; select public.request_withdrawal(400000); rollback to savepoint e;
\echo 'P18-8. a valid request (expect sent, then 100000 available, diajukan, masked number)'
select public.request_withdrawal(200000) is not null as sent;
select available from public.creator_portal_balance;
select status, amount, account_number_masked from public.creator_portal_withdrawals;
\echo 'P18-9. a second request while one is open (expect WITHDRAW_PENDING_EXISTS)'
-- request_withdrawal locks the klipper row, so a second call at the same time
-- waits for the first and then sees it.
savepoint f; select public.request_withdrawal(100000); rollback to savepoint f;
\echo 'P18-10. the portal never shows the transfer proof (expect column does not exist)'
savepoint g; select transfer_proof_path from public.creator_portal_withdrawals; rollback to savepoint g;
\echo 'P18-11. A changes the account to another holder name (expect f / 24-hour hold)'
select public.save_creator_bank_account('BRI', '998877665', 'Orang Lain') is not null as saved;
select holder_matches_name, hold_until > now() + interval '23 hours' as held from public.creator_portal_bank_account;
reset role;

-- Manager.
select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from p18_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'P18-12. the manager reads withdrawals, processes one, adjusts a balance (expect 0, OWNER_ONLY, OWNER_ONLY)'
select count(*) as rows from public.withdrawals;
savepoint h; select public.process_withdrawal((select id from public.creator_ledger_entries where entry_type = 'penarikan' and creator_id = '18181818-0000-0000-0000-0000000000a1' limit 1), 'diproses'); rollback to savepoint h;
savepoint i; select public.adjust_balance('18181818-0000-0000-0000-0000000000a1', 1000, 'x'); rollback to savepoint i;
\echo 'P18-13. the manager sees the account masked, with the name check (expect *****7665 / f)'
select account_number_masked, holder_matches_name from public.get_masked_bank_account('18181818-0000-0000-0000-0000000000a1');
reset role;

-- Owner processes.
select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p18_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
create temporary table p18_w on commit drop as
select id from public.withdrawals where creator_id = '18181818-0000-0000-0000-0000000000a1';
\echo 'P18-14. paid straight from diajukan (expect INVALID_WITHDRAWAL_TRANSITION)'
savepoint j; select public.process_withdrawal((select id from p18_w), 'dibayar', current_date, 'x/proof.png'); rollback to savepoint j;
\echo 'P18-15. the owner edits a withdrawal directly (expect UPDATE 0: no update policy)'
update public.withdrawals set amount = 1 where id = (select id from p18_w);
\echo 'P18-16. diproses, then paid without proof (expect ok, WITHDRAWAL_PAID_NEEDS_PROOF)'
select public.process_withdrawal((select id from p18_w), 'diproses');
savepoint k; select public.process_withdrawal((select id from p18_w), 'dibayar', current_date, ''); rollback to savepoint k;
\echo 'P18-17. rejected without a reason, then with one (expect WITHDRAWAL_REJECT_NEEDS_REASON, then refund 300000)'
savepoint l; select public.process_withdrawal((select id from p18_w), 'ditolak', null, null, ''); rollback to savepoint l;
select public.process_withdrawal((select id from p18_w), 'ditolak', null, null, 'Nama pemilik rekening tidak cocok');
\echo '       creator_balance() is not callable through the API (expect permission denied)'
savepoint l2; select public.creator_balance('18181818-0000-0000-0000-0000000000a1'); rollback to savepoint l2;
reset role;
select public.creator_balance('18181818-0000-0000-0000-0000000000a1') as balance_after_refund;

select set_config('request.jwt.claims', json_build_object('sub', '18181818-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P18-18. A reads the rejection, then requests within the 24-hour hold (expect reason, then WITHDRAW_BANK_RECENT)'
select status, rejection_reason from public.creator_portal_withdrawals;
savepoint m; select public.request_withdrawal(300000); rollback to savepoint m;
reset role;
select set_config('request.jwt.claims', '', true) is not null as no_claims;
\echo 'P18-19. withdrawals change only through the functions, even as superuser (expect WITHDRAWAL_FUNCTION_ONLY)'
savepoint n; update public.withdrawals set amount = 1 where id = (select id from p18_w); rollback to savepoint n;
update public.creator_bank_accounts set changed_at = now() - interval '2 days' where creator_id = '18181818-0000-0000-0000-0000000000a1';

select set_config('request.jwt.claims', json_build_object('sub', '18181818-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
\echo 'P18-20. after the hold, the whole balance (expect sent, 0 available)'
select public.request_withdrawal(300000) is not null as sent;
select available from public.creator_portal_balance;
reset role;
select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p18_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
\echo 'P18-21. processed and paid with date, proof and a Rp 2.500 fee borne by the klipper (expect dibayar / t / 2500)'
select public.process_withdrawal((select id from public.withdrawals where creator_id = '18181818-0000-0000-0000-0000000000a1' and status = 'diajukan'), 'diproses');
\echo '       a transfer fee as large as the amount (expect WITHDRAWAL_FEE_INVALID)'
savepoint n2; select public.process_withdrawal((select id from public.withdrawals where creator_id = '18181818-0000-0000-0000-0000000000a1' and status = 'diproses'), 'dibayar', current_date, 'withdrawals/p18.png', null, 300000); rollback to savepoint n2;
select public.process_withdrawal((select id from public.withdrawals where creator_id = '18181818-0000-0000-0000-0000000000a1' and status = 'diproses'), 'dibayar', current_date, 'withdrawals/p18.png', null, 2500);
select status, paid_at is not null as paid, transfer_fee from public.withdrawals where creator_id = '18181818-0000-0000-0000-0000000000a1' order by requested_at desc limit 1;
\echo 'P18-22. a negative balance after a correction blocks withdrawals (expect -50000, then WITHDRAW_BELOW_MIN or ABOVE_BALANCE)'
select public.adjust_balance('18181818-0000-0000-0000-0000000000a1', -50000, 'Pembatalan setelah penarikan');
reset role;
select public.creator_balance('18181818-0000-0000-0000-0000000000a1') as balance;
select set_config('request.jwt.claims', json_build_object('sub', '18181818-0000-0000-0000-0000000000f1', 'role', 'authenticated')::text, true) is not null as klipper_a;
set local role authenticated;
savepoint o; select public.request_withdrawal(100000); rollback to savepoint o;
select total_withdrawn from public.creator_portal_balance;
\echo '       the klipper sees the fee and what reached the account (expect 300000 / 2500 / 297500)'
select amount, transfer_fee, net_amount from public.creator_portal_withdrawals where status = 'dibayar';
reset role;

-- Blocked klipper B (FR-M3-09).
select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p18_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
update public.creators set status = 'diblokir', blocked_reason = 'Uji blokir saldo', blocked_at = now() where id = '18181818-0000-0000-0000-0000000000a2';
reset role;
select set_config('request.jwt.claims', json_build_object('sub', '18181818-0000-0000-0000-0000000000f2', 'role', 'authenticated')::text, true) is not null as klipper_b;
set local role authenticated;
\echo 'P18-23. a blocked klipper still reads their frozen balance (expect diblokir / reason / 200000)'
select a.status, a.blocked_reason, b.available from public.creator_portal_account a, public.creator_portal_balance b;
\echo 'P18-24. but cannot withdraw or change the account (expect WITHDRAW_CREATOR_BLOCKED, CREATOR_NOT_FOUND)'
savepoint p; select public.request_withdrawal(100000); rollback to savepoint p;
savepoint q; select public.save_creator_bank_account('BRI', '12345678', 'Klipper Saldo B'); rollback to savepoint q;
\echo 'P18-25. only their own entries, nothing of klipper A (expect 1 / 0 / 0)'
select (select count(*) from public.creator_portal_ledger) as own_entries,
       (select count(*) from public.creator_portal_withdrawals) as withdrawals,
       (select count(*) from public.creator_ledger_entries) as base_table;
reset role;

select set_config('request.jwt.claims', json_build_object('sub', (select owner_id from p18_roles), 'role', 'authenticated')::text, true) is not null as owner_claims;
set local role authenticated;
\echo 'P18-26. deleting an account with a balance (expect ANONYMIZE_BALANCE_NOT_ZERO)'
savepoint r; select public.anonymize_creator('18181818-0000-0000-0000-0000000000a2'); rollback to savepoint r;
\echo 'P18-27. the ledger stays append-only for the owner too (expect UPDATE 0, DELETE 0)'
update public.creator_ledger_entries set amount = 1 where creator_id = '18181818-0000-0000-0000-0000000000a1';
delete from public.creator_ledger_entries where creator_id = '18181818-0000-0000-0000-0000000000a1';
reset role;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;

-- ---------------------------------------------------------------------------
-- PRD 1.3: the campaign objective belongs to legacy paket campaigns (FR-M4-01)
-- ---------------------------------------------------------------------------
begin;
create temporary table obj_roles on commit drop as
select (select id from public.profiles where role = 'manager' and is_active limit 1) as manager_id;
grant select on obj_roles to authenticated;

insert into public.clients (id, name, type, province) values ('0b0b0b0b-0000-0000-0000-000000000001','Objective Client','kampus_swasta','Kalimantan Selatan');
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date, status, access, payout_model) values
 ('0b0b0b0b-0000-0000-0000-0000000000c1','0b0b0b0b-0000-0000-0000-000000000001','OBJ-01','Paket lama','pendaftar','2026-10-01','2026-10-31','draft','undangan','paket'),
 ('0b0b0b0b-0000-0000-0000-0000000000c2','0b0b0b0b-0000-0000-0000-000000000001','OBJ-02','Paket event','event','2026-10-01','2026-10-31','draft','undangan','paket');

select set_config('request.jwt.claims', json_build_object('sub', (select manager_id from obj_roles), 'role', 'authenticated')::text, true) is not null as manager_claims;
set local role authenticated;
\echo 'OBJ-1. a new per_views campaign drops the objective it was sent (expect null / per_views)'
insert into public.campaigns (id, client_id, code, name, objective, start_date, end_date) values ('0b0b0b0b-0000-0000-0000-0000000000c3','0b0b0b0b-0000-0000-0000-000000000001','OBJ-03','Terbuka','pendaftar','2026-10-01','2026-10-31');
select objective, payout_model from public.campaigns where id = '0b0b0b0b-0000-0000-0000-0000000000c3';
\echo 'OBJ-2. a per_views campaign cannot get one later (expect null)'
update public.campaigns set objective = 'awareness' where id = '0b0b0b0b-0000-0000-0000-0000000000c3';
select objective from public.campaigns where id = '0b0b0b0b-0000-0000-0000-0000000000c3';
\echo 'OBJ-3. legacy paket campaigns keep theirs (expect pendaftar / event)'
update public.campaigns set name = 'Paket lama diubah' where id = '0b0b0b0b-0000-0000-0000-0000000000c1';
select objective from public.campaigns where id in ('0b0b0b0b-0000-0000-0000-0000000000c1','0b0b0b0b-0000-0000-0000-0000000000c2') order by code;
\echo 'OBJ-4. a paket draft switched to per_views loses it (expect null / per_views)'
update public.campaigns set payout_model = 'per_views' where id = '0b0b0b0b-0000-0000-0000-0000000000c2';
select objective, payout_model from public.campaigns where id = '0b0b0b0b-0000-0000-0000-0000000000c2';
reset role;
-- Fixtures were created inside this transaction; the rollback removes them.
rollback;
