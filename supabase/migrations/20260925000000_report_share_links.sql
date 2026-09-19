-- v1.1 (Phase 8): read-only report links for clients (PRD FR-M9-05).
--
-- Only the SHA-256 hash of the token is stored; the link itself is shown
-- once when it is created. A link stays valid until it is revoked or its
-- optional expiry passes, and only for campaigns that are aktif or selesai.

create table public.report_share_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete restrict,
  last_viewed_at timestamptz,
  view_count integer not null default 0,
  constraint report_share_links_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint report_share_links_revoked_check check ((revoked_at is null) = (revoked_by is null)),
  constraint report_share_links_expiry_check check (expires_at is null or expires_at > created_at),
  constraint report_share_links_view_count_check check (view_count >= 0)
);

-- At most one link that has not been revoked per campaign.
create unique index report_share_links_one_open_idx
  on public.report_share_links (campaign_id)
  where revoked_at is null;

-- Members may create and revoke links; everything else about a link is fixed.
-- View counters are written only by the public page through the service role
-- (no JWT, so auth.uid() is null).
create or replace function public.guard_report_share_link()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  campaign_status public.campaign_status;
begin
  if tg_op = 'INSERT' then
    select status into campaign_status from public.campaigns where id = new.campaign_id;
    if campaign_status is null or campaign_status not in ('aktif', 'selesai') then
      raise exception 'SHARE_LINK_CAMPAIGN_STATUS: links are only for aktif or selesai campaigns';
    end if;
    if new.revoked_at is not null or new.view_count <> 0 or new.last_viewed_at is not null then
      raise exception 'SHARE_LINK_FIXED: a new link starts unrevoked and unviewed';
    end if;
    return new;
  end if;

  if new.campaign_id is distinct from old.campaign_id
    or new.token_hash is distinct from old.token_hash
    or new.expires_at is distinct from old.expires_at
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'SHARE_LINK_FIXED: campaign, token, expiry and creator of a link cannot change';
  end if;

  if old.revoked_at is not null
    and (new.revoked_at is distinct from old.revoked_at or new.revoked_by is distinct from old.revoked_by) then
    raise exception 'SHARE_LINK_REVOKED: a revoked link cannot be restored';
  end if;

  if (select auth.uid()) is not null then
    if new.view_count is distinct from old.view_count
      or new.last_viewed_at is distinct from old.last_viewed_at then
      raise exception 'SHARE_LINK_FIXED: view counters are recorded by the public page only';
    end if;
    -- The revoking member is always the caller.
    if old.revoked_at is null and new.revoked_at is not null then
      new.revoked_by := (select auth.uid());
    end if;
  end if;

  return new;
end;
$$;

create trigger report_share_links_guard
  before insert or update on public.report_share_links
  for each row
  execute function public.guard_report_share_link();

alter table public.report_share_links enable row level security;

create policy "report_share_links_select_active_members"
  on public.report_share_links for select to authenticated
  using (public.is_active_member());

create policy "report_share_links_insert_active_members"
  on public.report_share_links for insert to authenticated
  with check (public.is_active_member() and created_by = (select auth.uid()));

-- Used to revoke; the trigger limits what an update may change.
create policy "report_share_links_update_active_members"
  on public.report_share_links for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

-- No delete policy: revoked links stay as the audit record.

-- Resolves a token hash for the public report page and counts the view in
-- one statement. Returns the campaign id, or null when the link is unknown,
-- revoked, expired, or the campaign is no longer aktif/selesai.
create or replace function public.open_report_share_link(p_token_hash text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  update public.report_share_links as link
  set view_count = link.view_count + 1,
      last_viewed_at = now()
  from public.campaigns as campaign
  where link.token_hash = p_token_hash
    and link.revoked_at is null
    and (link.expires_at is null or link.expires_at > now())
    and campaign.id = link.campaign_id
    and campaign.status in ('aktif', 'selesai')
  returning link.campaign_id;
$$;

revoke execute on function public.open_report_share_link(text) from public, anon, authenticated;
grant execute on function public.open_report_share_link(text) to service_role;
