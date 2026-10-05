-- FR-M15-09 (PRD 1.7): the public campaign card shows a cover image and the
-- minimum views a clip needs before it earns (`min_views_to_earn`).
--
-- The cover is NOT campaign material: material stays in the private
-- `campaign-assets` bucket behind the kliper login. The team uploads a
-- separate cover image to its own public bucket, so the public site can load
-- it without a session or signed URL.

alter table public.campaigns
  add column cover_image_path text,
  -- Covers live under the campaign's own folder: `<campaign_id>/<file>`.
  add constraint campaigns_cover_image_path_check check (
    cover_image_path is null
    or (cover_image_path like id::text || '/%' and cover_image_path not like '%..%')
  );

comment on column public.campaigns.cover_image_path is
  'Path in the public campaign-covers bucket; shown on the public campaign card (FR-M15-09).';

-- Public bucket: anyone may load a cover through its public URL (no RLS on
-- that endpoint), but only internal members list, upload or remove files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-covers',
  'campaign-covers',
  true,
  2 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "campaign_covers_objects_select_active_members"
  on storage.objects for select to authenticated
  using (bucket_id = 'campaign-covers' and public.is_active_member());

create policy "campaign_covers_objects_insert_active_members"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'campaign-covers' and public.is_active_member());

create policy "campaign_covers_objects_delete_active_members"
  on storage.objects for delete to authenticated
  using (bucket_id = 'campaign-covers' and public.is_active_member());

-- The catalog's columns change, so the view and its row function are rebuilt.
drop view public.public_campaign_catalog;
drop function public.public_campaign_catalog_rows();

create function public.public_campaign_catalog_rows()
returns table (
  id uuid,
  name text,
  client_name text,
  allowed_platforms public.social_platform[],
  rate_per_1000_views bigint,
  max_payout_per_clip bigint,
  max_clips_per_creator integer,
  min_views_to_earn bigint,
  local_only boolean,
  end_date date,
  published_at timestamptz,
  cover_image_path text,
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
    c.min_views_to_earn,
    c.local_only,
    c.end_date,
    c.published_at,
    c.cover_image_path,
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

revoke all on public.public_campaign_catalog from public, anon, authenticated;
grant select on public.public_campaign_catalog to anon, authenticated;
