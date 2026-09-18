-- Phase 3: creator content and the review workflow (PRD M6, section 7).

create type public.review_status as enum ('menunggu_review', 'disetujui', 'revisi', 'ditolak');

create type public.review_decision as enum ('disetujui', 'revisi', 'ditolak');

create type public.live_status as enum ('belum_tayang', 'tayang', 'dihapus');

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  -- Restrict: content carries review history and, later, metrics and payouts.
  campaign_creator_id uuid not null references public.campaign_creators (id) on delete restrict,
  platform public.social_platform not null,
  draft_url text,
  draft_file_path text,
  caption_draft text not null default '',
  review_status public.review_status not null default 'menunggu_review',
  revision_count integer not null default 0,
  posted_url text,
  posted_at timestamptz,
  live_status public.live_status not null default 'belum_tayang',
  removed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contents_draft_source_check check (num_nonnulls(draft_url, draft_file_path) >= 1),
  constraint contents_draft_url_check check (draft_url is null or draft_url ~ '^https?://'),
  constraint contents_posted_url_check check (posted_url is null or posted_url ~ '^https?://'),
  constraint contents_revision_count_check check (revision_count >= 0),
  -- FR-M6-04: a live URL only exists for approved content.
  constraint contents_posted_requires_approval check (
    posted_url is null or review_status = 'disetujui'
  ),
  constraint contents_posted_pair_check check ((posted_url is null) = (posted_at is null)),
  -- FR-M6-05: `belum_tayang` has no live URL; `tayang`/`dihapus` always have one.
  constraint contents_live_status_check check ((live_status = 'belum_tayang') = (posted_url is null)),
  -- `dihapus` needs the removal date, which cannot precede the posting time.
  constraint contents_removed_check check (
    (live_status = 'dihapus') = (removed_at is not null)
    and (removed_at is null or removed_at >= posted_at)
  )
);

create index contents_assignment_idx on public.contents (campaign_creator_id);
create index contents_review_status_idx on public.contents (review_status, created_at);
create index contents_posted_at_idx on public.contents (posted_at) where posted_at is not null;

create trigger contents_set_updated_at
  before update on public.contents
  for each row
  execute function public.set_updated_at();

-- Review history (FR-M6-06). Rows are never changed once written.
create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  -- Restrict: reviewed content cannot be deleted, so its history survives.
  content_id uuid not null references public.contents (id) on delete restrict,
  decision public.review_decision not null,
  checklist jsonb not null default '{}'::jsonb,
  notes text not null default '',
  -- Copy of the draft that was reviewed, filled by the trigger below.
  draft_snapshot jsonb not null default '{}'::jsonb,
  reviewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  -- FR-M6-02: a revision request must say what to change.
  constraint content_reviews_revision_notes_check check (
    decision <> 'revisi' or length(trim(notes)) > 0
  )
);

create index content_reviews_content_idx on public.content_reviews (content_id, created_at);

/** Campaign that owns a content row, for the closed-campaign lock. */
create or replace function public.content_campaign_id(p_campaign_creator_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select campaign_id from public.campaign_creators where id = p_campaign_creator_id;
$$;

revoke execute on function public.content_campaign_id(uuid) from anon;

-- Content rules (FR-M6-01, FR-M6-02, PRD 8.5). Service-role / direct SQL calls
-- carry no JWT and pass through, e.g. for seeding.
create or replace function public.guard_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_via_review boolean := coalesce(current_setting('app.content_review', true), '') = 'on';
begin
  if (select auth.uid()) is null then
    return coalesce(new, old);
  end if;

  perform public.assert_campaign_editable(
    public.content_campaign_id(coalesce(new.campaign_creator_id, old.campaign_creator_id))
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  if tg_op = 'INSERT' then
    -- New content always starts unreviewed and offline.
    new.review_status := 'menunggu_review';
    new.revision_count := 0;
    new.live_status := 'belum_tayang';
    new.posted_url := null;
    new.posted_at := null;
    new.removed_at := null;
    return new;
  end if;

  if new.campaign_creator_id is distinct from old.campaign_creator_id then
    raise exception 'CONTENT_ASSIGNMENT_FIXED: content cannot move to another creator';
  end if;

  if new.review_status is distinct from old.review_status and not v_via_review then
    -- Outside a review, the only status change is a new draft after `revisi`.
    if not (old.review_status = 'revisi' and new.review_status = 'menunggu_review') then
      raise exception 'INVALID_REVIEW_TRANSITION: % -> % needs a review', old.review_status, new.review_status;
    end if;
    if new.revision_count <> old.revision_count + 1 then
      raise exception 'INVALID_REVIEW_TRANSITION: a new draft increments revision_count';
    end if;
  elsif new.revision_count is distinct from old.revision_count then
    raise exception 'INVALID_REVIEW_TRANSITION: revision_count only changes with a new draft';
  end if;

  -- Drafts are frozen once reviewed; they change only while waiting for a
  -- review or when a new draft answers a revision request.
  if (new.draft_url is distinct from old.draft_url
      or new.draft_file_path is distinct from old.draft_file_path
      or new.caption_draft is distinct from old.caption_draft
      or new.platform is distinct from old.platform)
    and not (
      old.review_status = 'menunggu_review'
      or (old.review_status = 'revisi' and new.review_status = 'menunggu_review')
    )
  then
    raise exception 'DRAFT_FROZEN: the draft cannot change after it was reviewed';
  end if;

  return new;
end;
$$;

create trigger contents_guard
  before insert or update or delete on public.contents
  for each row
  execute function public.guard_content_change();

-- Reviews (FR-M6-02, FR-M6-03): validated here, then the decision is applied
-- to the content row in the same transaction.
create or replace function public.guard_content_review_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  v_paid_label_required boolean;
  v_required text[] := array['sesuai_brief', 'tanpa_larangan', 'info_akurat'];
  v_key text;
begin
  select * into v_content from public.contents where id = new.content_id for update;
  if not found then
    raise exception 'CONTENT_NOT_FOUND: content % does not exist', new.content_id;
  end if;

  perform public.assert_campaign_editable(public.content_campaign_id(v_content.campaign_creator_id));

  if v_content.review_status <> 'menunggu_review' then
    raise exception 'REVIEW_NOT_PENDING: only content waiting for review can be reviewed';
  end if;

  if new.decision = 'disetujui' then
    select c.paid_label_required into v_paid_label_required
    from public.campaign_creators cc
    join public.campaigns c on c.id = cc.campaign_id
    where cc.id = v_content.campaign_creator_id;

    if v_paid_label_required then
      v_required := v_required || 'label_berbayar';
    end if;

    foreach v_key in array v_required loop
      if coalesce((new.checklist ->> v_key)::boolean, false) is not true then
        raise exception 'CHECKLIST_INCOMPLETE: % must be checked before approval', v_key;
      end if;
    end loop;
  end if;

  if (select auth.uid()) is not null then
    new.reviewer_id := (select auth.uid());
  end if;
  new.notes := trim(new.notes);
  new.draft_snapshot := jsonb_build_object(
    'draft_url', v_content.draft_url,
    'draft_file_path', v_content.draft_file_path,
    'caption_draft', v_content.caption_draft,
    'platform', v_content.platform,
    'revision_count', v_content.revision_count
  );

  return new;
end;
$$;

create trigger content_reviews_guard_insert
  before insert on public.content_reviews
  for each row
  execute function public.guard_content_review_insert();

create or replace function public.apply_content_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Lets guard_content_change accept this status change as a review.
  perform set_config('app.content_review', 'on', true);
  update public.contents
  set review_status = new.decision::text::public.review_status
  where id = new.content_id;
  perform set_config('app.content_review', 'off', true);
  return new;
end;
$$;

create trigger content_reviews_apply
  after insert on public.content_reviews
  for each row
  execute function public.apply_content_review();

create or replace function public.prevent_content_review_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'REVIEW_IMMUTABLE: review history cannot be changed or deleted';
end;
$$;

create trigger content_reviews_immutable
  before update or delete on public.content_reviews
  for each row
  execute function public.prevent_content_review_change();

alter table public.contents enable row level security;

create policy "contents_select_active_members"
  on public.contents for select to authenticated
  using (public.is_active_member());

create policy "contents_insert_active_members"
  on public.contents for insert to authenticated
  with check (public.is_active_member());

create policy "contents_update_active_members"
  on public.contents for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "contents_delete_active_members"
  on public.contents for delete to authenticated
  using (public.is_active_member());

-- Both roles review (PRD section 3). No update/delete policy: append-only.
alter table public.content_reviews enable row level security;

create policy "content_reviews_select_active_members"
  on public.content_reviews for select to authenticated
  using (public.is_active_member());

create policy "content_reviews_insert_active_members"
  on public.content_reviews for insert to authenticated
  with check (public.is_active_member());

-- Private bucket for draft files. Large videos go through a link instead.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-drafts',
  'content-drafts',
  false,
  50 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

create policy "content_drafts_objects_select_active_members"
  on storage.objects for select to authenticated
  using (bucket_id = 'content-drafts' and public.is_active_member());

create policy "content_drafts_objects_insert_active_members"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'content-drafts' and public.is_active_member());

create policy "content_drafts_objects_delete_active_members"
  on storage.objects for delete to authenticated
  using (bucket_id = 'content-drafts' and public.is_active_member());
