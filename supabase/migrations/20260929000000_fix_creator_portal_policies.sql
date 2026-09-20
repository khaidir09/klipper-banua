-- Repairs the creator portal write path (PRD M13, phase 10).
--
-- Why this exists: 20260927000000_creator_submissions.sql was corrected after
-- it had already been applied to a database. A version that is recorded as
-- applied is never re-run, so those databases kept the first, broken form:
--
--   * the policies checked ownership with a subquery over `campaign_creators`
--     and `contents`, which the portal role cannot read (RLS), so the check
--     was always false and every draft, live report and metric submission was
--     rejected with a row level security error;
--   * `contents` and `metric_submissions` had no select policy for the
--     creator, and Postgres needs select on a row before it can be updated or
--     deleted;
--   * `review_metric_submission` did not mark its own update, so the trigger
--     rejected it and accepting a submission failed.
--
-- Everything below is written to be safe on a database that already has the
-- corrected version, so both states end up identical.

-- ---------------------------------------------------------------------------
-- 1. Ownership helpers. A policy expression runs as the caller, so it cannot
--    look into `campaign_creators` or `contents`: these answer instead.
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
-- 2. The creator's policies, in their intended form.
-- ---------------------------------------------------------------------------
drop policy if exists "contents_select_portal_creator" on public.contents;
create policy "contents_select_portal_creator"
  on public.contents for select to authenticated
  using (public.creator_owns_content(id));

drop policy if exists "contents_insert_portal_creator" on public.contents;
create policy "contents_insert_portal_creator"
  on public.contents for insert to authenticated
  with check (public.creator_owns_assignment(campaign_creator_id));

drop policy if exists "contents_update_portal_creator" on public.contents;
create policy "contents_update_portal_creator"
  on public.contents for update to authenticated
  using (public.creator_owns_assignment(campaign_creator_id))
  with check (public.creator_owns_assignment(campaign_creator_id));

drop policy if exists "metric_submissions_select_portal_creator" on public.metric_submissions;
create policy "metric_submissions_select_portal_creator"
  on public.metric_submissions for select to authenticated
  using (public.creator_owns_content(content_id));

drop policy if exists "metric_submissions_insert_portal_creator" on public.metric_submissions;
create policy "metric_submissions_insert_portal_creator"
  on public.metric_submissions for insert to authenticated
  with check (public.creator_owns_content(content_id));

drop policy if exists "metric_submissions_delete_portal_creator" on public.metric_submissions;
create policy "metric_submissions_delete_portal_creator"
  on public.metric_submissions for delete to authenticated
  using (status = 'menunggu' and public.creator_owns_content(content_id));

-- ---------------------------------------------------------------------------
-- 3. The two guards that need to recognise the team's own writes.
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
