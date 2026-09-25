-- FR-M15-09 (PRD 1.6): the open campaigns on the public site (/kampanye), so a
-- visitor sees what is on offer before signing up. Same campaigns as the
-- portal catalog (FR-M17-03), fewer columns: no brief, must-do/must-not,
-- material or assignment status (those stay behind the klipper login), and
-- never the package price, targets or internal notes.
--
-- `anon` must not call the budget helpers directly (they answer for any
-- campaign id), so the rows come from one security definer function that only
-- returns listed campaigns, and the view is a thin, typed wrapper over it.

create or replace function public.public_campaign_catalog_rows()
returns table (
  id uuid,
  name text,
  client_name text,
  allowed_platforms public.social_platform[],
  rate_per_1000_views bigint,
  max_payout_per_clip bigint,
  max_clips_per_creator integer,
  local_only boolean,
  end_date date,
  published_at timestamptz,
  budget_total bigint,
  budget_used bigint,
  budget_remaining bigint,
  budget_remaining_pct integer,
  budget_exhausted boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    cl.name,
    c.allowed_platforms,
    c.rate_per_1000_views,
    c.max_payout_per_clip,
    c.max_clips_per_creator,
    c.local_only,
    c.end_date,
    c.published_at,
    c.creator_budget,
    greatest(spent.cost, 0),
    -- Mirrors budgetRemaining() in lib/calculations/campaign-budget.ts.
    greatest(c.creator_budget - spent.cost, 0),
    -- Mirrors budgetRemainingPct().
    case
      when c.creator_budget > 0 then
        least(100, greatest(0, c.creator_budget - spent.cost) * 100 / c.creator_budget)::integer
      else 0
    end,
    public.campaign_budget_exhausted(c.id)
  from public.campaigns c
  join public.clients cl on cl.id = c.client_id
  cross join lateral (select public.campaign_creator_cost(c.id) as cost) spent
  where c.status = 'aktif'
    and c.access = 'terbuka'
    and c.payout_model = 'per_views'
    and c.end_date >= public.campaign_today();
$$;

revoke execute on function public.public_campaign_catalog_rows() from public;
grant execute on function public.public_campaign_catalog_rows() to anon, authenticated;

create view public.public_campaign_catalog
with (security_invoker = on) as
select * from public.public_campaign_catalog_rows();

comment on view public.public_campaign_catalog is
  'FR-M15-09: open per_views campaigns for the public site. Summary columns only: no brief, material, package_price, targets or internal notes.';

-- Read-only for everyone: drop the write grants Supabase gives new relations.
revoke all on public.public_campaign_catalog from public, anon, authenticated;
grant select on public.public_campaign_catalog to anon, authenticated;
