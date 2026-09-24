-- FR-M17-03 (revised): the catalog shows the klipper budget in Rupiah (total,
-- spent, left) next to the share left. The package price, targets and internal
-- notes stay out. New columns are appended, so `create or replace view`
-- accepts them.

create or replace view public.creator_portal_catalog
with (security_invoker = off) as
select
  c.id,
  c.code,
  c.name,
  cl.name as client_name,
  c.objective,
  c.brief,
  c.must_do,
  c.must_not,
  c.hashtags,
  c.paid_label_required,
  c.allowed_platforms,
  c.rate_per_1000_views,
  c.max_payout_per_clip,
  c.max_payout_per_creator,
  c.min_views_to_earn,
  c.max_clips_per_creator,
  c.local_only,
  c.start_date,
  c.end_date,
  c.min_live_days,
  c.claim_grace_days,
  c.published_at,
  -- Mirrors budgetRemainingPct() in lib/calculations/campaign-budget.ts.
  case
    when c.creator_budget > 0 then
      least(100, greatest(0, c.creator_budget - spent.cost) * 100 / c.creator_budget)::integer
    else 0
  end as budget_remaining_pct,
  public.campaign_budget_exhausted(c.id) as budget_exhausted,
  (select count(*) from public.campaign_assets a where a.campaign_id = c.id)::integer as asset_count,
  cc.id as assignment_id,
  cc.status as assignment_status,
  c.creator_budget as budget_total,
  greatest(spent.cost, 0) as budget_used,
  -- Mirrors budgetRemaining().
  greatest(c.creator_budget - spent.cost, 0) as budget_remaining
from public.campaigns c
join public.clients cl on cl.id = c.client_id
cross join lateral (select public.campaign_creator_cost(c.id) as cost) spent
left join public.campaign_creators cc
  on cc.campaign_id = c.id and cc.creator_id = public.current_creator_id()
where c.status = 'aktif'
  and c.access = 'terbuka'
  and c.payout_model = 'per_views'
  and c.end_date >= public.campaign_today()
  and exists (
    select 1 from public.creators me
    where me.id = public.current_creator_id()
      and me.status in ('aktif', 'terverifikasi', 'prospek')
  );

comment on view public.creator_portal_catalog is
  'FR-M17-03: open per_views campaigns for the signed-in klipper, with the klipper budget (total, spent, left). No package_price, targets or internal notes.';
