-- Removes everything the end-to-end test (or a training session) did to the
-- three demo campaigns, so `npm run seed:demo` can recreate them.
-- LOCAL database only: npm run seed:demo:reset
--
-- Triggers are switched off because closed campaigns, reviews and paid
-- payouts are deliberately immutable in normal use. Storage rows are removed
-- here too; on the local stack the underlying files are simply orphaned.

\set ON_ERROR_STOP 1
begin;
set local session_replication_role = replica;

create temporary table demo_campaigns on commit drop as
  select unnest(array[
    'de300000-0000-4000-8000-0000000000c1',  -- PMB campaign, run by the E2E owner flow
    'de300000-0000-4000-8000-0000000000c2',  -- portal campaign, always running (M13)
    'de300000-0000-4000-8000-0000000000c3'   -- open per_views campaign in the catalog (M17)
  ]::uuid[]) as id;

create temporary table demo_assignments on commit drop as
  select id from public.campaign_creators where campaign_id in (select id from demo_campaigns);
create temporary table demo_contents on commit drop as
  select id from public.contents where campaign_creator_id in (select id from demo_assignments);

delete from public.metric_snapshots where content_id in (select id from demo_contents);
delete from public.content_reviews where content_id in (select id from demo_contents);
delete from public.contents where id in (select id from demo_contents);
delete from public.link_clicks where campaign_creator_id in (select id from demo_assignments);
delete from public.payouts where campaign_creator_id in (select id from demo_assignments);
delete from public.metric_submissions where content_id in (select id from demo_contents);
delete from public.registrant_reports where campaign_id in (select id from demo_campaigns);
delete from public.client_payments where campaign_id in (select id from demo_campaigns);
delete from public.ops_time_logs where campaign_id in (select id from demo_campaigns);
delete from public.report_share_links where campaign_id in (select id from demo_campaigns);
delete from public.campaign_assets where campaign_id in (select id from demo_campaigns);
delete from public.campaign_creators where id in (select id from demo_assignments);
delete from public.campaigns where id in (select id from demo_campaigns);
delete from storage.objects
  where bucket_id in ('campaign-assets', 'content-drafts', 'metric-proofs', 'finance-proofs')
    and split_part(name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and split_part(name, '/', 1)::uuid in (select id from demo_campaigns);

-- Demo creators anonymized during training become editable again; seed:demo
-- then restores their fictitious profile, accounts and bank details.
update public.creators
  set anonymized_at = null, birth_date = coalesce(birth_date, '2000-01-01')
  where id::text like 'de300000-%' and anonymized_at is not null;

commit;
\echo 'Demo campaigns removed; run npm run seed:demo to recreate them.'
