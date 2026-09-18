-- Removes everything the end-to-end test (or a training session) did to the
-- demo campaign, so `npm run seed:demo` can recreate it as a fresh draft.
-- LOCAL database only: npm run seed:demo:reset
--
-- Triggers are switched off because closed campaigns, reviews and paid
-- payouts are deliberately immutable in normal use. Storage rows are removed
-- here too; on the local stack the underlying files are simply orphaned.

\set ON_ERROR_STOP 1
begin;
set local session_replication_role = replica;

create temporary table demo_assignments on commit drop as
  select id from public.campaign_creators where campaign_id = 'de300000-0000-4000-8000-0000000000c1';
create temporary table demo_contents on commit drop as
  select id from public.contents where campaign_creator_id in (select id from demo_assignments);

delete from public.metric_snapshots where content_id in (select id from demo_contents);
delete from public.content_reviews where content_id in (select id from demo_contents);
delete from public.contents where id in (select id from demo_contents);
delete from public.link_clicks where campaign_creator_id in (select id from demo_assignments);
delete from public.payouts where campaign_creator_id in (select id from demo_assignments);
delete from public.registrant_reports where campaign_id = 'de300000-0000-4000-8000-0000000000c1';
delete from public.client_payments where campaign_id = 'de300000-0000-4000-8000-0000000000c1';
delete from public.ops_time_logs where campaign_id = 'de300000-0000-4000-8000-0000000000c1';
delete from public.campaign_assets where campaign_id = 'de300000-0000-4000-8000-0000000000c1';
delete from public.campaign_creators where id in (select id from demo_assignments);
delete from public.campaigns where id = 'de300000-0000-4000-8000-0000000000c1';
delete from storage.objects
  where bucket_id in ('campaign-assets', 'content-drafts', 'metric-proofs', 'finance-proofs')
    and name like 'de300000-0000-4000-8000-0000000000c1/%';

-- Demo creators anonymized during training become editable again; seed:demo
-- then restores their fictitious profile, accounts and bank details.
update public.creators
  set anonymized_at = null, birth_date = coalesce(birth_date, '2000-01-01')
  where id::text like 'de300000-%' and anonymized_at is not null;

commit;
\echo 'Demo campaign removed; run npm run seed:demo to recreate it.'
