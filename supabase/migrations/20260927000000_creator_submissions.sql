-- Phase 10 (v2.0): what a creator may send from the portal (PRD M13:
-- FR-M13-05, FR-M13-06, FR-M13-07, FR-M13-09).
--
-- The rule is "the creator fills in, the team decides":
--   * a draft becomes an ordinary `contents` row in the existing review queue;
--   * a live report is only a proposal until the team confirms it;
--   * metric numbers wait in `metric_submissions` until the team accepts them,
--     so nothing that feeds a payout arrives unchecked.
-- Reads still go through the `creator_portal_*` views at the bottom.

create type public.submission_status as enum ('menunggu', 'diterima', 'ditolak');

-- ---------------------------------------------------------------------------
-- 1. Live report proposed by the creator (FR-M13-09).
-- ---------------------------------------------------------------------------
alter table public.contents
  add column proposed_posted_url text,
  add column proposed_posted_at timestamptz,
  add column proposed_at timestamptz;

alter table public.contents
  add constraint contents_proposed_url_check
    check (proposed_posted_url is null or proposed_posted_url ~ '^https?://'),
  add constraint contents_proposed_pair_check
    check (num_nonnulls(proposed_posted_url, proposed_posted_at, proposed_at) in (0, 3));

comment on column public.contents.proposed_posted_url is
  'Live URL reported by the creator from the portal; only the team turns it into posted_url (FR-M13-09).';

-- ---------------------------------------------------------------------------
-- 2. Metric numbers wait here until the team accepts them (FR-M13-06).
-- ---------------------------------------------------------------------------
create table public.metric_submissions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents (id) on delete restrict,
  checkpoint public.metric_checkpoint not null,
  captured_at timestamptz not null,
  views bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  -- Same evidence the team would have asked for over WhatsApp.
  proof_path text not null,
  status public.submission_status not null default 'menunggu',
  review_notes text not null default '',
  submitted_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  -- The official snapshot this submission became, once accepted.
  snapshot_id uuid references public.metric_snapshots (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint metric_submissions_counts_check check (
    views >= 0 and likes >= 0 and comments >= 0 and shares >= 0 and saves >= 0
  ),
  constraint metric_submissions_proof_check check (length(trim(proof_path)) > 0),
  -- FR-M13-06: a rejection always tells the creator why.
  constraint metric_submissions_rejected_notes_check check (
    status <> 'ditolak' or length(trim(review_notes)) > 0
  ),
  constraint metric_submissions_reviewed_pair_check check (
    (status = 'menunggu') = (reviewed_at is null)
  )
);

comment on table public.metric_submissions is
  'Metric numbers sent by a creator from the portal; official only once the team accepts them (FR-M13-06).';

-- One open submission per checkpoint, so the queue cannot fill with duplicates.
create unique index metric_submissions_pending_idx
  on public.metric_submissions (content_id, checkpoint)
  where status = 'menunggu';

create index metric_submissions_status_idx on public.metric_submissions (status, created_at);
create index metric_submissions_content_idx on public.metric_submissions (content_id);

create trigger metric_submissions_set_updated_at
  before update on public.metric_submissions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. What a portal creator may change on their own content.
--    Runs after `contents_guard` (alphabetical order), which already forces a
--    new row to start unreviewed and offline.
-- ---------------------------------------------------------------------------
create or replace function public.guard_portal_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only the portal role is restricted here; the team keeps FR-M6 rules.
  -- `app.content_review` marks the status update apply_content_review makes
  -- right after a review, which is the team's decision, not the creator's.
  if public.current_creator_id() is null
    or coalesce(current_setting('app.content_review', true), '') = 'on'
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.proposed_posted_url is not null or new.proposed_posted_at is not null then
      raise exception 'PORTAL_FIELD_LOCKED: a live report comes after approval';
    end if;
    new.proposed_at := null;
    return new;
  end if;

  -- A live report is allowed only for approved content that is not live yet.
  if new.proposed_posted_url is distinct from old.proposed_posted_url
    or new.proposed_posted_at is distinct from old.proposed_posted_at
  then
    if old.review_status <> 'disetujui' or old.live_status <> 'belum_tayang' then
      raise exception 'PORTAL_FIELD_LOCKED: only approved content that is not live can be reported';
    end if;
    new.proposed_at := now();
  end if;

  -- Everything else is the team's: status, live URL, live status, ownership.
  if new.posted_url is distinct from old.posted_url
    or new.posted_at is distinct from old.posted_at
    or new.live_status is distinct from old.live_status
    or new.removed_at is distinct from old.removed_at
    or new.campaign_creator_id is distinct from old.campaign_creator_id
    or new.created_by is distinct from old.created_by
  then
    raise exception 'PORTAL_FIELD_LOCKED: only the team can change that';
  end if;

  -- The review status only moves the way FR-M6-02 allows: a new draft after a
  -- revision request. `contents_guard` checks the counter.
  if new.review_status is distinct from old.review_status
    and not (old.review_status = 'revisi' and new.review_status = 'menunggu_review')
  then
    raise exception 'PORTAL_FIELD_LOCKED: only the team reviews content';
  end if;

  return new;
end;
$$;

create trigger contents_guard_portal
  before insert or update on public.contents
  for each row
  execute function public.guard_portal_content_change();

-- ---------------------------------------------------------------------------
-- 4. Submission rules, mirroring guard_metric_snapshot_change.
-- ---------------------------------------------------------------------------
create or replace function public.guard_metric_submission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  -- Set by review_metric_submission while it closes a submission.
  v_via_review boolean := coalesce(current_setting('app.submission_review', true), '') = 'on';
begin
  if (select auth.uid()) is null or v_via_review then
    return coalesce(new, old);
  end if;

  select * into v_content from public.contents where id = coalesce(new.content_id, old.content_id);

  perform public.assert_campaign_editable(
    public.content_campaign_id(v_content.campaign_creator_id)
  );

  if tg_op = 'DELETE' then
    if old.status <> 'menunggu' then
      raise exception 'SUBMISSION_NOT_PENDING: a verified submission stays on record';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if v_content.posted_at is null or v_content.live_status = 'belum_tayang' then
      raise exception 'SUBMISSION_NEEDS_LIVE_CONTENT: metrics are reported for live content only';
    end if;
    if new.captured_at < v_content.posted_at then
      raise exception 'SUBMISSION_BEFORE_POSTING: captured_at cannot precede posted_at';
    end if;

    -- The queue is entered one way only; verification happens in the function
    -- below, which runs as the table owner.
    new.status := 'menunggu';
    new.review_notes := '';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.snapshot_id := null;
    new.submitted_by := (select auth.uid());
    return new;
  end if;

  raise exception 'SUBMISSION_NOT_PENDING: use review_metric_submission to verify a submission';
end;
$$;

create trigger metric_submissions_guard
  before insert or update or delete on public.metric_submissions
  for each row
  execute function public.guard_metric_submission_change();

-- ---------------------------------------------------------------------------
-- 5. Verification by the team: accepting writes the official snapshot and
--    closes the submission in one transaction (FR-M13-06).
-- ---------------------------------------------------------------------------
create or replace function public.review_metric_submission(
  p_id uuid,
  p_accept boolean,
  p_notes text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.metric_submissions%rowtype;
  v_content public.contents%rowtype;
  v_snapshot_id uuid;
  v_notes text := coalesce(trim(p_notes), '');
begin
  if not public.is_active_member() then
    raise exception 'SUBMISSION_INTERNAL_ONLY: only the team can verify a submission';
  end if;

  select * into v_submission from public.metric_submissions where id = p_id for update;
  if not found then
    raise exception 'SUBMISSION_NOT_FOUND: submission % does not exist', p_id;
  end if;

  if v_submission.status <> 'menunggu' then
    raise exception 'SUBMISSION_NOT_PENDING: this submission was already verified';
  end if;

  select * into v_content from public.contents where id = v_submission.content_id;
  perform public.assert_campaign_editable(
    public.content_campaign_id(v_content.campaign_creator_id)
  );

  if not p_accept then
    if v_notes = '' then
      raise exception 'SUBMISSION_REJECT_NEEDS_NOTES: tell the creator why it was rejected';
    end if;

    -- Lets guard_metric_submission_change accept this update as a verification.
    perform set_config('app.submission_review', 'on', true);
    update public.metric_submissions
      set status = 'ditolak',
          review_notes = v_notes,
          reviewed_by = (select auth.uid()),
          reviewed_at = now()
      where id = p_id;
    perform set_config('app.submission_review', 'off', true);
    return null;
  end if;

  insert into public.metric_snapshots (
    content_id, checkpoint, captured_at, views, likes, comments, shares, saves, proof_path
  )
  values (
    v_submission.content_id,
    v_submission.checkpoint,
    v_submission.captured_at,
    v_submission.views,
    v_submission.likes,
    v_submission.comments,
    v_submission.shares,
    v_submission.saves,
    v_submission.proof_path
  )
  returning id into v_snapshot_id;

  perform set_config('app.submission_review', 'on', true);
  update public.metric_submissions
    set status = 'diterima',
        review_notes = v_notes,
        reviewed_by = (select auth.uid()),
        reviewed_at = now(),
        snapshot_id = v_snapshot_id
    where id = p_id;
  perform set_config('app.submission_review', 'off', true);

  return v_snapshot_id;
end;
$$;

revoke execute on function public.review_metric_submission(uuid, boolean, text) from public, anon;
grant execute on function public.review_metric_submission(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Ownership helpers. A policy expression runs as the caller, so it cannot
--    look into `campaign_creators` or `contents` (both closed to the portal
--    role): these `security definer` helpers answer instead.
-- ---------------------------------------------------------------------------
create or replace function public.creator_owns_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_creators cc
    join public.campaigns c on c.id = cc.campaign_id
    where cc.id = target_assignment_id
      and cc.creator_id = public.current_creator_id()
      and c.status = 'aktif'
  );
$$;

create or replace function public.creator_owns_content(target_content_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.contents ct
    join public.campaign_creators cc on cc.id = ct.campaign_creator_id
    where ct.id = target_content_id
      and cc.creator_id = public.current_creator_id()
  );
$$;

revoke execute on function public.creator_owns_assignment(uuid) from anon;
revoke execute on function public.creator_owns_content(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 7. Row level security.
-- ---------------------------------------------------------------------------
alter table public.metric_submissions enable row level security;

create policy "metric_submissions_select_active_members"
  on public.metric_submissions for select to authenticated
  using (public.is_active_member());

-- The creator sends and may withdraw an open submission of their own; the
-- trigger above keeps a verified one on record.
-- Postgres needs SELECT on a row before it can be updated or deleted, so the
-- creator sees their own submissions here as well as through the view. The
-- table holds nothing internal beyond the reviewer's id.
create policy "metric_submissions_select_portal_creator"
  on public.metric_submissions for select to authenticated
  using (public.creator_owns_content(content_id));

create policy "metric_submissions_insert_portal_creator"
  on public.metric_submissions for insert to authenticated
  with check (public.creator_owns_content(content_id));

create policy "metric_submissions_delete_portal_creator"
  on public.metric_submissions for delete to authenticated
  using (status = 'menunggu' and public.creator_owns_content(content_id));

-- Verification runs inside review_metric_submission, so no update policy is
-- granted to anyone; the team cannot edit the queue by hand.

-- Drafts (FR-M13-05): only for the creator's own assignment on a running
-- campaign. Column limits live in guard_portal_content_change. The select
-- policy is what makes the update below possible (Postgres reads the row
-- first); every column of a creator's own content is theirs anyway.
create policy "contents_select_portal_creator"
  on public.contents for select to authenticated
  using (public.creator_owns_content(id));

create policy "contents_insert_portal_creator"
  on public.contents for insert to authenticated
  with check (public.creator_owns_assignment(campaign_creator_id));

create policy "contents_update_portal_creator"
  on public.contents for update to authenticated
  using (public.creator_owns_assignment(campaign_creator_id))
  with check (public.creator_owns_assignment(campaign_creator_id));

-- Storage: a creator uploads their own draft files and metric screenshots into
-- the campaign folder (`<campaign_id>/…`, see lib/storage/upload.ts) and can
-- read back what is in that folder. Removing files stays with the team.
create policy "content_drafts_objects_select_portal_creator"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'content-drafts'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.creator_assigned_to_campaign(((storage.foldername(name))[1])::uuid)
  );

create policy "content_drafts_objects_insert_portal_creator"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'content-drafts'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.creator_assigned_to_campaign(((storage.foldername(name))[1])::uuid)
  );

create policy "metric_proofs_objects_select_portal_creator"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'metric-proofs'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.creator_assigned_to_campaign(((storage.foldername(name))[1])::uuid)
  );

create policy "metric_proofs_objects_insert_portal_creator"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'metric-proofs'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.creator_assigned_to_campaign(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- 8. The portal's read surface for phase 10. Same contract as phase 9:
--    `security_invoker = off`, filtered on the signed-in creator, whitelisted
--    columns, never readable by `anon`.
-- ---------------------------------------------------------------------------

create view public.creator_portal_contents
with (security_invoker = off) as
select
  c.id,
  c.campaign_creator_id,
  cc.campaign_id,
  c.platform,
  c.draft_url,
  c.draft_file_path,
  c.caption_draft,
  c.review_status,
  c.revision_count,
  c.posted_url,
  c.posted_at,
  c.live_status,
  c.removed_at,
  c.proposed_posted_url,
  c.proposed_posted_at,
  c.proposed_at,
  c.created_at,
  c.updated_at
from public.contents c
join public.campaign_creators cc on cc.id = c.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_contents is
  'FR-M13-05: the creator''s own content, with review and live status.';

create view public.creator_portal_reviews
with (security_invoker = off) as
select
  r.id,
  r.content_id,
  r.decision,
  r.notes,
  r.created_at
from public.content_reviews r
join public.contents c on c.id = r.content_id
join public.campaign_creators cc on cc.id = c.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_reviews is
  'FR-M13-05: review decisions and notes for the creator, without the internal checklist or reviewer.';

create view public.creator_portal_metrics
with (security_invoker = off) as
select
  s.id,
  s.content_id,
  s.checkpoint,
  s.captured_at,
  s.views,
  s.likes,
  s.comments,
  s.shares,
  s.saves,
  s.created_at
from public.metric_snapshots s
join public.contents c on c.id = s.content_id
join public.campaign_creators cc on cc.id = c.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_metrics is
  'FR-M13-06: official snapshots on the creator''s own content.';

create view public.creator_portal_submissions
with (security_invoker = off) as
select
  s.id,
  s.content_id,
  s.checkpoint,
  s.captured_at,
  s.views,
  s.likes,
  s.comments,
  s.shares,
  s.saves,
  s.proof_path,
  s.status,
  s.review_notes,
  s.reviewed_at,
  s.created_at
from public.metric_submissions s
join public.contents c on c.id = s.content_id
join public.campaign_creators cc on cc.id = c.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_submissions is
  'FR-M13-06: the creator''s own metric submissions and how they were verified.';

create view public.creator_portal_payouts
with (security_invoker = off) as
select
  p.id,
  p.campaign_creator_id,
  cc.campaign_id,
  p.base_amount,
  p.views_bonus,
  p.registrant_bonus,
  p.adjustment_amount,
  p.adjustment_reason,
  p.total_amount,
  p.status,
  p.paid_at,
  p.calculated_at
from public.payouts p
join public.campaign_creators cc on cc.id = p.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_payouts is
  'FR-M13-07: the creator''s own fee, without the transfer proof or the internal calculation snapshot.';

revoke all on public.creator_portal_contents from anon;
revoke all on public.creator_portal_reviews from anon;
revoke all on public.creator_portal_metrics from anon;
revoke all on public.creator_portal_submissions from anon;
revoke all on public.creator_portal_payouts from anon;

grant select on public.creator_portal_contents to authenticated;
grant select on public.creator_portal_reviews to authenticated;
grant select on public.creator_portal_metrics to authenticated;
grant select on public.creator_portal_submissions to authenticated;
grant select on public.creator_portal_payouts to authenticated;
