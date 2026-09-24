-- Phase 17 (v4.0): clip submissions and views verification (PRD M18,
-- FR-M6-03, FR-M6-04, FR-M10-01, FR-M10-03) with a minimal honor ledger
-- (FR-M19-01, FR-M19-02; balance pages follow in Phase 18).
--
-- The rule stays "the klipper fills in, the team decides":
--   * a clip is an ordinary `contents` row. While it waits, its live URL and
--     time sit in `proposed_posted_*`; the team's approval moves them to
--     `posted_*`, so metrics and reports only ever count approved clips
--     (PRD 8.4) and the constraints of FR-M6-04 stay as they are;
--   * the claimed views wait in `metric_submissions` until the team enters
--     the verified number;
--   * honor is credited to `creator_ledger_entries` by the verification
--     functions below. The amount comes from lib/calculations/clip-earning.ts;
--     the database only enforces the invariants (budget, per-klipper cap, and
--     never more than the verified views earn), locking the campaign row so
--     two approvals at once cannot overspend the budget.

-- ---------------------------------------------------------------------------
-- 1. Types and columns
-- ---------------------------------------------------------------------------
create type public.clip_rejection_reason as enum (
  'bukan_pemilik', 'langgar_brief', 'di_luar_periode', 'duplikat', 'views_tidak_wajar', 'lainnya'
);

-- All five values now, so Phase 18 adds tables and functions but no enum change.
create type public.ledger_entry_type as enum (
  'honor_klip', 'pembatalan', 'penyesuaian', 'penarikan', 'pengembalian_penarikan'
);

alter table public.contents
  add column posted_url_normalized text,
  add column verified_views bigint,
  add column rejection_reason public.clip_rejection_reason,
  add column caption_code_checked boolean not null default false;

alter table public.contents
  add constraint contents_verified_views_check check (verified_views is null or verified_views >= 0),
  add constraint contents_rejection_reason_check check (
    rejection_reason is null or review_status = 'ditolak'
  );

-- A clip has no draft: its source is the live URL it was sent with.
alter table public.contents drop constraint contents_draft_source_check;
alter table public.contents
  add constraint contents_draft_source_check check (
    num_nonnulls(draft_url, draft_file_path, proposed_posted_url, posted_url) >= 1
  );

comment on column public.contents.posted_url_normalized is
  'FR-M18-02: clip URL normalised by normalize_clip_url(); unique across all clips that were not rejected.';
comment on column public.contents.verified_views is
  'FR-M18-04: views the team verified on the latest accepted submission of a per_views clip.';

-- FR-M18-02: one video can be claimed once, whatever the campaign or klipper.
-- A rejected clip frees its URL so the real owner can still send it
-- (`bukan_pemilik`); the klipper it was rejected for cannot (guard below).
create unique index contents_posted_url_normalized_key
  on public.contents (posted_url_normalized)
  where posted_url_normalized is not null and review_status <> 'ditolak';

alter table public.metric_submissions
  add column verified_views bigint,
  add column credited_amount bigint,
  add column credit_limited boolean not null default false;

alter table public.metric_submissions
  add constraint metric_submissions_verified_views_check check (
    verified_views is null or verified_views >= 0
  ),
  add constraint metric_submissions_credited_amount_check check (
    credited_amount is null or credited_amount >= 0
  );

comment on column public.metric_submissions.credit_limited is
  'PRD 8.6: the credit was cut by the per-klipper cap or the remaining budget ("dibatasi batas kampanye").';

-- ---------------------------------------------------------------------------
-- 2. URL normalisation. Mirrored by normalizeClipUrl() in
--    lib/contents/clip-url.ts; both must give the same answer.
-- ---------------------------------------------------------------------------
create or replace function public.normalize_clip_url(url text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  trackers constant text[] := array[
    '_r', '_t', 'checksum', 'enter_from', 'fbclid', 'feature', 'gclid', 'igsh', 'igshid',
    'is_copy_url', 'is_from_webapp', 'mibextid', 'pp', 'rdid', 'ref', 'refsrc',
    'sender_device', 'sender_web_id', 'share_app_id', 'share_id', 'share_item_id',
    'share_link_id', 'si', 'social_sharing', 't', 'timestamp', 'tt_from', 'u_code',
    'ug_btm', 'user_id', 'web_id'
  ];
  v text;
  base text;
  query text := '';
  param text;
  kept text[] := '{}';
begin
  if url is null or trim(url) = '' then
    return null;
  end if;

  v := split_part(lower(trim(url)), '#', 1);
  if position('?' in v) > 0 then
    base := substr(v, 1, position('?' in v) - 1);
    query := substr(v, position('?' in v) + 1);
  else
    base := v;
  end if;

  base := regexp_replace(base, '^http://', 'https://');
  base := regexp_replace(base, '^https://(www\.|m\.)', 'https://');
  base := regexp_replace(base, '/+$', '');

  foreach param in array string_to_array(query, '&') loop
    continue when param = '';
    continue when split_part(param, '=', 1) like 'utm\_%'
      or split_part(param, '=', 1) = any (trackers);
    kept := kept || param;
  end loop;

  if cardinality(kept) = 0 then
    return base;
  end if;

  select array_agg(p order by p collate "C") into kept from unnest(kept) as p;
  return base || '?' || array_to_string(kept, '&');
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. The honor ledger (minimal; FR-M19-01). Append-only, written only by the
--    security definer functions in this file.
-- ---------------------------------------------------------------------------
create table public.creator_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete restrict,
  entry_type public.ledger_entry_type not null,
  -- Signed whole Rupiah: credits positive, debits negative.
  amount bigint not null,
  campaign_id uuid references public.campaigns (id) on delete restrict,
  content_id uuid references public.contents (id) on delete restrict,
  metric_submission_id uuid references public.metric_submissions (id) on delete restrict,
  -- The withdrawals table arrives in Phase 18, which adds the foreign key.
  withdrawal_id uuid,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint creator_ledger_entries_amount_sign_check check (
    case entry_type
      when 'honor_klip' then amount > 0
      when 'pengembalian_penarikan' then amount > 0
      when 'pembatalan' then amount < 0
      when 'penarikan' then amount < 0
      else amount <> 0
    end
  ),
  constraint creator_ledger_entries_clip_ref_check check (
    entry_type not in ('honor_klip', 'pembatalan')
    or (campaign_id is not null and content_id is not null)
  )
);

comment on table public.creator_ledger_entries is
  'FR-M19-01: klipper balance ledger. Balance = sum(amount). Append-only; entries only come from security definer functions.';

create index creator_ledger_entries_creator_idx on public.creator_ledger_entries (creator_id, created_at);
create index creator_ledger_entries_campaign_idx on public.creator_ledger_entries (campaign_id);
create index creator_ledger_entries_content_idx on public.creator_ledger_entries (content_id);

create or replace function public.guard_ledger_entry()
returns trigger
language plpgsql
as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'LEDGER_IMMUTABLE: ledger entries cannot be changed or deleted';
  end if;
  if coalesce(current_setting('app.ledger_write', true), '') <> 'on' then
    raise exception 'LEDGER_FUNCTION_ONLY: ledger entries are written by the verification functions';
  end if;
  return new;
end;
$$;

create trigger creator_ledger_entries_guard
  before insert or update or delete on public.creator_ledger_entries
  for each row
  execute function public.guard_ledger_entry();

alter table public.creator_ledger_entries enable row level security;

-- The team reads; nobody inserts through the API (no insert policy). The
-- klipper's view of their own entries is Phase 18 (creator_portal_ledger).
create policy "creator_ledger_entries_select_active_members"
  on public.creator_ledger_entries for select to authenticated
  using (public.is_active_member());

-- Honor spent on a campaign (PRD 8.4 creator_cost), now from the ledger.
-- Every Phase 16 rule (budget exhausted, catalog percentage, budget floor)
-- reads this function.
create or replace function public.campaign_creator_cost(target_campaign_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.creator_ledger_entries
  where campaign_id = target_campaign_id
    and entry_type in ('honor_klip', 'pembatalan');
$$;

-- Net honor already credited for one clip (PRD 8.6 already_credited).
create or replace function public.clip_credited_amount(target_content_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.creator_ledger_entries
  where content_id = target_content_id
    and entry_type in ('honor_klip', 'pembatalan');
$$;

revoke execute on function public.clip_credited_amount(uuid) from public, anon;
grant execute on function public.clip_credited_amount(uuid) to authenticated;

-- Writes one honor credit after checking the invariants of PRD 8.6. The
-- caller holds the campaign row lock. Not callable through the API.
create or replace function public.record_clip_credit(
  p_campaign_id uuid,
  p_content_id uuid,
  p_creator_id uuid,
  p_submission_id uuid,
  p_verified_views bigint,
  p_credit bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.campaigns%rowtype;
  v_bound bigint;
  v_entry_id uuid;
begin
  if p_credit is null or p_credit < 0 then
    raise exception 'CREDIT_INVALID: the credit must be zero or more';
  end if;
  if p_credit = 0 then
    return;
  end if;

  select * into v_campaign from public.campaigns where id = p_campaign_id;

  -- Upper bound: what the verified views earn for this clip, capped per clip.
  v_bound := case
    when p_verified_views >= v_campaign.min_views_to_earn
      then floor(p_verified_views::numeric * v_campaign.rate_per_1000_views / 1000)::bigint
    else 0
  end;
  if v_campaign.max_payout_per_clip is not null then
    v_bound := least(v_bound, v_campaign.max_payout_per_clip);
  end if;
  if public.clip_credited_amount(p_content_id) + p_credit > v_bound then
    raise exception 'CREDIT_ABOVE_CLIP_EARNING: the credit exceeds what the verified views earn';
  end if;

  if v_campaign.max_payout_per_creator is not null and (
    select coalesce(sum(amount), 0)
    from public.creator_ledger_entries
    where campaign_id = p_campaign_id
      and creator_id = p_creator_id
      and entry_type in ('honor_klip', 'pembatalan')
  ) + p_credit > v_campaign.max_payout_per_creator then
    raise exception 'CREDIT_ABOVE_CREATOR_CAP: the credit exceeds the per-klipper cap';
  end if;

  if public.campaign_creator_cost(p_campaign_id) + p_credit > v_campaign.creator_budget then
    raise exception 'BUDGET_EXCEEDED: the credit exceeds the remaining campaign budget';
  end if;

  perform set_config('app.ledger_write', 'on', true);
  insert into public.creator_ledger_entries (
    creator_id, entry_type, amount, campaign_id, content_id, metric_submission_id, created_by
  )
  values (
    p_creator_id, 'honor_klip', p_credit, p_campaign_id, p_content_id, p_submission_id, (select auth.uid())
  )
  returning id into v_entry_id;
  perform set_config('app.ledger_write', 'off', true);

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'creator_ledger_entry', v_entry_id, 'ledger_credit',
    jsonb_build_object(
      'creator_id', p_creator_id, 'campaign_id', p_campaign_id, 'content_id', p_content_id,
      'amount', p_credit, 'verified_views', p_verified_views
    )
  );
end;
$$;

-- Takes back every rupiah credited for one clip (FR-M18-06, FR-M18-07).
create or replace function public.record_clip_cancellation(
  p_campaign_id uuid,
  p_content_id uuid,
  p_creator_id uuid,
  p_notes text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_amount bigint := public.clip_credited_amount(p_content_id);
  v_entry_id uuid;
begin
  if v_amount <= 0 then
    return 0;
  end if;

  perform set_config('app.ledger_write', 'on', true);
  insert into public.creator_ledger_entries (
    creator_id, entry_type, amount, campaign_id, content_id, notes, created_by
  )
  values (
    p_creator_id, 'pembatalan', -v_amount, p_campaign_id, p_content_id, coalesce(p_notes, ''), (select auth.uid())
  )
  returning id into v_entry_id;
  perform set_config('app.ledger_write', 'off', true);

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'creator_ledger_entry', v_entry_id, 'ledger_cancel',
    jsonb_build_object(
      'creator_id', p_creator_id, 'campaign_id', p_campaign_id, 'content_id', p_content_id,
      'amount', -v_amount, 'notes', coalesce(p_notes, '')
    )
  );
  return v_amount;
end;
$$;

revoke execute on function public.record_clip_credit(uuid, uuid, uuid, uuid, bigint, bigint) from public, anon, authenticated;
revoke execute on function public.record_clip_cancellation(uuid, uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Clip rules on `contents` (FR-M18-01, FR-M18-02). Runs after
--    `contents_guard` (alphabetical order), which already forces a new row to
--    start unreviewed and offline, and before `contents_guard_portal`.
-- ---------------------------------------------------------------------------

-- Payout model of the campaign behind an assignment.
create or replace function public.assignment_payout_model(target_assignment_id uuid)
returns public.payout_model
language sql
stable
security definer
set search_path = ''
as $$
  select c.payout_model
  from public.campaign_creators cc
  join public.campaigns c on c.id = cc.campaign_id
  where cc.id = target_assignment_id;
$$;

revoke execute on function public.assignment_payout_model(uuid) from anon;

create or replace function public.guard_clip_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assignment public.campaign_creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_creator public.creators%rowtype;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  select * into v_assignment from public.campaign_creators where id = new.campaign_creator_id;
  select * into v_campaign from public.campaigns where id = v_assignment.campaign_id;

  if v_campaign.payout_model is distinct from 'per_views' then
    return new;
  end if;

  new.posted_url_normalized := public.normalize_clip_url(coalesce(new.posted_url, new.proposed_posted_url));

  -- Service role, seeds and the verification functions below pass through.
  if (select auth.uid()) is null
    or coalesce(current_setting('app.clip_write', true), '') = 'on'
  then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- The team decides through verify_clip / cancel_clip, which also keep the
    -- ledger right; a direct edit of these columns would bypass it.
    if new.posted_url is distinct from old.posted_url
      or new.posted_at is distinct from old.posted_at
      or new.live_status is distinct from old.live_status
      or new.removed_at is distinct from old.removed_at
      or new.verified_views is distinct from old.verified_views
      or new.rejection_reason is distinct from old.rejection_reason
      or new.caption_code_checked is distinct from old.caption_code_checked
      or new.proposed_posted_url is distinct from old.proposed_posted_url
      or new.proposed_posted_at is distinct from old.proposed_posted_at
      or new.platform is distinct from old.platform
    then
      raise exception 'CLIP_USE_VERIFY: clips change through the verification page';
    end if;
    return new;
  end if;

  -- INSERT: a new clip, checked in the order the portal explains them
  -- (lib/campaigns/clips.ts clipSubmissionBlockers).
  if new.proposed_posted_url is null or new.proposed_posted_at is null then
    raise exception 'CLIP_NEEDS_URL: a clip is sent with its live URL and time';
  end if;

  select * into v_creator from public.creators where id = v_assignment.creator_id;

  if v_creator.status not in ('aktif', 'terverifikasi') then
    raise exception 'CLIP_CREATOR_NOT_ACTIVE: the klipper account is not active';
  end if;
  if v_creator.terms_version is distinct from public.current_creator_terms_version() then
    raise exception 'CLIP_TERMS_OUTDATED: accept the latest terms first';
  end if;
  if v_assignment.status <> 'bergabung' then
    raise exception 'CLIP_ASSIGNMENT_NOT_JOINED: clips are sent for a joined assignment only';
  end if;
  if v_campaign.status <> 'aktif' or v_campaign.end_date < public.campaign_today() then
    raise exception 'CLIP_CAMPAIGN_CLOSED: the campaign no longer accepts clips';
  end if;
  if public.campaign_budget_exhausted(v_campaign.id) then
    raise exception 'CLIP_BUDGET_EXHAUSTED: the campaign budget is used up';
  end if;
  if not (new.platform = any (v_campaign.allowed_platforms)) then
    raise exception 'CLIP_PLATFORM_NOT_ALLOWED: the campaign does not accept this platform';
  end if;
  if not exists (
    select 1 from public.creator_social_accounts s
    where s.creator_id = v_creator.id and s.platform = new.platform
  ) then
    raise exception 'CLIP_NO_SOCIAL_ACCOUNT: register a social account on this platform first';
  end if;

  -- Mirrors clipPeriod() in lib/campaigns/clips.ts.
  v_period_start := greatest(
    coalesce(v_assignment.joined_at, '-infinity'::timestamptz),
    (v_campaign.start_date::timestamp at time zone 'Asia/Makassar')
  );
  v_period_end := ((v_campaign.end_date + 1)::timestamp at time zone 'Asia/Makassar');

  if new.proposed_posted_at > now() + interval '5 minutes' then
    raise exception 'CLIP_POSTED_IN_FUTURE: the posting time is in the future';
  end if;
  if new.proposed_posted_at < v_period_start or new.proposed_posted_at >= v_period_end then
    raise exception 'CLIP_OUTSIDE_PERIOD: the clip was posted outside the campaign period';
  end if;

  -- Serialises clip counting per assignment.
  perform 1 from public.campaign_creators where id = v_assignment.id for update;
  if (
    select count(*) from public.contents ct
    where ct.campaign_creator_id = v_assignment.id and ct.review_status <> 'ditolak'
  ) >= v_campaign.max_clips_per_creator then
    raise exception 'CLIP_LIMIT_REACHED: the klipper already sent the maximum number of clips';
  end if;

  if exists (
    select 1
    from public.contents ct
    join public.campaign_creators cc on cc.id = ct.campaign_creator_id
    where cc.creator_id = v_creator.id
      and ct.review_status = 'ditolak'
      and ct.posted_url_normalized = new.posted_url_normalized
  ) then
    raise exception 'CLIP_URL_REJECTED_BEFORE: this clip was rejected before';
  end if;

  new.verified_views := null;
  new.rejection_reason := null;
  new.caption_code_checked := false;
  new.draft_url := null;
  new.draft_file_path := null;
  new.proposed_at := now();
  return new;
end;
$$;

create trigger contents_guard_clip
  before insert or update on public.contents
  for each row
  execute function public.guard_clip_change();

-- FR-M18-01: a clip and its first views submission arrive together. Checked
-- at commit, so submit_clip can insert both in one transaction.
create or replace function public.assert_clip_has_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or public.assignment_payout_model(new.campaign_creator_id) is distinct from 'per_views'
  then
    return null;
  end if;
  if not exists (select 1 from public.metric_submissions where content_id = new.id) then
    raise exception 'CLIP_NEEDS_PROOF: a clip is sent with its views screenshot';
  end if;
  return null;
end;
$$;

create constraint trigger contents_clip_needs_submission
  after insert on public.contents
  deferrable initially deferred
  for each row
  execute function public.assert_clip_has_submission();

-- What a portal klipper may change on their own content. Package campaigns
-- keep the Phase 10 rules; a clip may only be sent back after a revision
-- request, with its URL unchanged (FR-M18-03).
create or replace function public.guard_portal_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed text[] := array['review_status', 'revision_count', 'updated_at'];
begin
  if public.current_creator_id() is null
    or coalesce(current_setting('app.content_review', true), '') = 'on'
    or coalesce(current_setting('app.clip_write', true), '') = 'on'
  then
    return new;
  end if;

  if public.assignment_payout_model(new.campaign_creator_id) = 'per_views' then
    if tg_op = 'INSERT' then
      return new;
    end if;
    if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed)
      or not (old.review_status = 'revisi' and new.review_status = 'menunggu_review')
    then
      raise exception 'PORTAL_FIELD_LOCKED: a clip can only be sent again after a revision request';
    end if;
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

-- ---------------------------------------------------------------------------
-- 5. Reviews. Package campaigns keep the FR-M6-03 checklist; clips use the
--    FR-M18-04 checklist and are only decided through verify_clip.
--    `app.clip_review` says which function is writing: verify, withdraw
--    (klipper left the campaign) or fraud (owner cancels an approved clip).
-- ---------------------------------------------------------------------------
create or replace function public.guard_content_review_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  v_campaign public.campaigns%rowtype;
  v_required text[];
  v_key text;
  v_mode text := coalesce(current_setting('app.clip_review', true), '');
begin
  select * into v_content from public.contents where id = new.content_id for update;
  if not found then
    raise exception 'CONTENT_NOT_FOUND: content % does not exist', new.content_id;
  end if;

  select c.* into v_campaign
  from public.campaign_creators cc
  join public.campaigns c on c.id = cc.campaign_id
  where cc.id = v_content.campaign_creator_id;

  perform public.assert_campaign_editable(v_campaign.id);

  if v_campaign.payout_model = 'per_views'
    and (select auth.uid()) is not null
    and v_mode not in ('verify', 'withdraw', 'fraud')
  then
    raise exception 'CLIP_USE_VERIFY: clips are decided on the verification page';
  end if;

  if not (
    v_content.review_status = 'menunggu_review'
    or (v_mode = 'withdraw' and v_content.review_status = 'revisi')
    or (v_mode = 'fraud' and v_content.review_status = 'disetujui')
  ) then
    raise exception 'REVIEW_NOT_PENDING: only content waiting for review can be reviewed';
  end if;

  if new.decision = 'disetujui' then
    v_required := case
      when v_campaign.payout_model = 'per_views' then array[
        'kode_verifikasi', 'akun_sesuai', 'sesuai_brief', 'tanpa_larangan', 'hashtag',
        'dalam_periode', 'views_cocok', 'tanpa_views_palsu'
      ]
      else array['sesuai_brief', 'tanpa_larangan', 'info_akurat']
    end;
    if v_campaign.paid_label_required then
      v_required := array_append(v_required, 'label_berbayar');
    end if;

    foreach v_key in array v_required loop
      if coalesce((new.checklist ->> v_key)::boolean, false) is not true then
        raise exception 'CHECKLIST_INCOMPLETE: % must be checked before approval', v_key;
      end if;
    end loop;
  end if;

  -- A withdrawal is the klipper's own act, not a reviewer's decision.
  new.reviewer_id := case when v_mode = 'withdraw' then null else (select auth.uid()) end;
  new.notes := trim(new.notes);
  new.draft_snapshot := jsonb_build_object(
    'draft_url', v_content.draft_url,
    'draft_file_path', v_content.draft_file_path,
    'caption_draft', v_content.caption_draft,
    'platform', v_content.platform,
    'revision_count', v_content.revision_count,
    'proposed_posted_url', v_content.proposed_posted_url,
    'proposed_posted_at', v_content.proposed_posted_at
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Views submissions. Package campaigns keep the Phase 10 rules. A clip
--    gets one initial submission (sent with it) and, once approved, views
--    updates at most every 24 hours until end_date + claim_grace_days
--    (FR-M18-05).
-- ---------------------------------------------------------------------------
create or replace function public.guard_metric_submission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  v_campaign public.campaigns%rowtype;
  v_via_review boolean := coalesce(current_setting('app.submission_review', true), '') = 'on';
begin
  if (select auth.uid()) is null or v_via_review then
    return coalesce(new, old);
  end if;

  select * into v_content from public.contents where id = coalesce(new.content_id, old.content_id);
  select c.* into v_campaign
  from public.campaign_creators cc
  join public.campaigns c on c.id = cc.campaign_id
  where cc.id = v_content.campaign_creator_id;

  perform public.assert_campaign_editable(v_campaign.id);

  if tg_op = 'DELETE' then
    if old.status <> 'menunggu' then
      raise exception 'SUBMISSION_NOT_PENDING: a verified submission stays on record';
    end if;
    if v_campaign.payout_model = 'per_views' and v_content.review_status <> 'disetujui' then
      raise exception 'SUBMISSION_INITIAL_FIXED: the views proof of a clip stays with the clip';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if v_campaign.payout_model = 'per_views' then
      new.checkpoint := 'lainnya';

      if v_content.review_status = 'menunggu_review' and v_content.posted_at is null then
        if exists (select 1 from public.metric_submissions where content_id = v_content.id) then
          raise exception 'VIEWS_UPDATE_NOT_ALLOWED: views updates start after the clip is approved';
        end if;
        if new.captured_at < v_content.proposed_posted_at then
          raise exception 'SUBMISSION_BEFORE_POSTING: captured_at cannot precede posted_at';
        end if;
      elsif v_content.review_status = 'disetujui' and v_content.live_status = 'tayang' then
        if public.campaign_today() > v_campaign.end_date + v_campaign.claim_grace_days then
          raise exception 'VIEWS_UPDATE_CLOSED: the claim period has ended';
        end if;
        if exists (
          select 1 from public.metric_submissions
          where content_id = v_content.id and created_at > now() - interval '24 hours'
        ) then
          raise exception 'VIEWS_UPDATE_TOO_SOON: wait 24 hours after the last submission';
        end if;
        if new.captured_at < v_content.posted_at then
          raise exception 'SUBMISSION_BEFORE_POSTING: captured_at cannot precede posted_at';
        end if;
      else
        raise exception 'VIEWS_UPDATE_NOT_ALLOWED: views updates are for approved, live clips';
      end if;
    else
      if v_content.posted_at is null or v_content.live_status = 'belum_tayang' then
        raise exception 'SUBMISSION_NEEDS_LIVE_CONTENT: metrics are reported for live content only';
      end if;
      if new.captured_at < v_content.posted_at then
        raise exception 'SUBMISSION_BEFORE_POSTING: captured_at cannot precede posted_at';
      end if;
    end if;

    new.status := 'menunggu';
    new.review_notes := '';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.snapshot_id := null;
    new.verified_views := null;
    new.credited_amount := null;
    new.credit_limited := false;
    new.submitted_by := (select auth.uid());
    return new;
  end if;

  raise exception 'SUBMISSION_NOT_PENDING: use the verification functions to verify a submission';
end;
$$;

-- Package campaigns keep review_metric_submission; clips need the credit.
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
  if public.assignment_payout_model(v_content.campaign_creator_id) = 'per_views' then
    raise exception 'CLIP_USE_VERIFY: clip views are verified on the verification page';
  end if;
  perform public.assert_campaign_editable(
    public.content_campaign_id(v_content.campaign_creator_id)
  );

  if not p_accept then
    if v_notes = '' then
      raise exception 'SUBMISSION_REJECT_NEEDS_NOTES: tell the creator why it was rejected';
    end if;

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

-- ---------------------------------------------------------------------------
-- 7. Sending a clip from the portal (FR-M18-01). Security invoker: RLS and
--    every trigger above apply to the klipper exactly as for a direct insert;
--    the function only makes the two inserts one transaction.
-- ---------------------------------------------------------------------------
create or replace function public.submit_clip(
  p_assignment_id uuid,
  p_platform public.social_platform,
  p_posted_url text,
  p_posted_at timestamptz,
  p_views bigint,
  p_likes bigint,
  p_comments bigint,
  p_shares bigint,
  p_proof_path text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  -- Chosen here, so the insert needs no RETURNING (the select policy on the
  -- new row cannot see it within the same statement).
  v_id uuid := gen_random_uuid();
begin
  insert into public.contents (
    id, campaign_creator_id, platform, proposed_posted_url, proposed_posted_at, proposed_at, created_by
  )
  values (
    v_id, p_assignment_id, p_platform, trim(p_posted_url), p_posted_at, now(), (select auth.uid())
  );

  insert into public.metric_submissions (
    content_id, checkpoint, captured_at, views, likes, comments, shares, saves, proof_path
  )
  values (
    v_id, 'lainnya', greatest(now(), p_posted_at), p_views, p_likes, p_comments, p_shares, 0, p_proof_path
  );

  return v_id;
end;
$$;

revoke execute on function public.submit_clip(uuid, public.social_platform, text, timestamptz, bigint, bigint, bigint, bigint, text) from public, anon;
grant execute on function public.submit_clip(uuid, public.social_platform, text, timestamptz, bigint, bigint, bigint, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Verification by the team (FR-M18-04, FR-M18-05, FR-M19-02).
-- ---------------------------------------------------------------------------
create or replace function public.verify_clip(
  p_content_id uuid,
  p_decision public.review_decision,
  p_checklist jsonb,
  p_notes text,
  p_rejection_reason public.clip_rejection_reason,
  p_verified_views bigint,
  p_credit bigint,
  p_credit_limited boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  v_assignment public.campaign_creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_submission public.metric_submissions%rowtype;
  v_review_id uuid;
  v_snapshot_id uuid;
  v_notes text := coalesce(trim(p_notes), '');
begin
  if not public.is_active_member() then
    raise exception 'CLIP_INTERNAL_ONLY: only the team verifies clips';
  end if;

  select * into v_content from public.contents where id = p_content_id for update;
  if not found then
    raise exception 'CONTENT_NOT_FOUND: content % does not exist', p_content_id;
  end if;
  select * into v_assignment from public.campaign_creators where id = v_content.campaign_creator_id;
  -- The campaign row lock serialises every credit on this campaign.
  select * into v_campaign from public.campaigns where id = v_assignment.campaign_id for update;

  if v_campaign.payout_model <> 'per_views' then
    raise exception 'CLIP_NOT_PER_VIEWS: package content is reviewed on the Konten tab';
  end if;
  if v_content.review_status <> 'menunggu_review' then
    raise exception 'REVIEW_NOT_PENDING: only content waiting for review can be reviewed';
  end if;

  select * into v_submission
  from public.metric_submissions
  where content_id = p_content_id and status = 'menunggu'
  order by created_at
  limit 1
  for update;

  if p_decision = 'disetujui' then
    if v_submission.id is null then
      raise exception 'CLIP_NEEDS_PROOF: the clip has no views submission to verify';
    end if;
    if p_verified_views is null or p_verified_views < 0 then
      raise exception 'CLIP_NEEDS_VERIFIED_VIEWS: enter the verified views';
    end if;
  elsif p_decision = 'ditolak' then
    if p_rejection_reason is null then
      raise exception 'CLIP_REJECT_NEEDS_REASON: pick a rejection reason';
    end if;
    if v_notes = '' then
      raise exception 'CLIP_REJECT_NEEDS_NOTES: tell the klipper why the clip was rejected';
    end if;
  end if;

  perform set_config('app.clip_review', 'verify', true);
  insert into public.content_reviews (content_id, decision, checklist, notes)
  values (p_content_id, p_decision, coalesce(p_checklist, '{}'::jsonb), v_notes)
  returning id into v_review_id;
  perform set_config('app.clip_review', '', true);

  perform set_config('app.clip_write', 'on', true);
  perform set_config('app.submission_review', 'on', true);

  if p_decision = 'disetujui' then
    update public.contents
      set posted_url = proposed_posted_url,
          posted_at = proposed_posted_at,
          live_status = 'tayang',
          verified_views = p_verified_views,
          caption_code_checked = coalesce((p_checklist ->> 'kode_verifikasi')::boolean, false)
      where id = p_content_id;

    insert into public.metric_snapshots (
      content_id, checkpoint, captured_at, views, likes, comments, shares, saves, proof_path
    )
    values (
      p_content_id, 'lainnya', v_submission.captured_at, p_verified_views, v_submission.likes,
      v_submission.comments, v_submission.shares, v_submission.saves, v_submission.proof_path
    )
    returning id into v_snapshot_id;

    update public.metric_submissions
      set status = 'diterima',
          review_notes = v_notes,
          reviewed_by = (select auth.uid()),
          reviewed_at = now(),
          snapshot_id = v_snapshot_id,
          verified_views = p_verified_views,
          credited_amount = coalesce(p_credit, 0),
          credit_limited = coalesce(p_credit_limited, false)
      where id = v_submission.id;

    perform public.record_clip_credit(
      v_campaign.id, p_content_id, v_assignment.creator_id, v_submission.id, p_verified_views, coalesce(p_credit, 0)
    );
  elsif p_decision = 'ditolak' then
    update public.contents set rejection_reason = p_rejection_reason where id = p_content_id;
    update public.metric_submissions
      set status = 'ditolak',
          review_notes = v_notes,
          reviewed_by = (select auth.uid()),
          reviewed_at = now()
      where content_id = p_content_id and status = 'menunggu';
  end if;
  -- `revisi`: the views submission stays open for the next review.

  perform set_config('app.submission_review', 'off', true);
  perform set_config('app.clip_write', 'off', true);
  return v_review_id;
end;
$$;

create or replace function public.verify_views_update(
  p_submission_id uuid,
  p_accept boolean,
  p_verified_views bigint,
  p_notes text,
  p_credit bigint,
  p_credit_limited boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.metric_submissions%rowtype;
  v_content public.contents%rowtype;
  v_assignment public.campaign_creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_snapshot_id uuid;
  v_notes text := coalesce(trim(p_notes), '');
begin
  if not public.is_active_member() then
    raise exception 'CLIP_INTERNAL_ONLY: only the team verifies clips';
  end if;

  select * into v_submission from public.metric_submissions where id = p_submission_id for update;
  if not found then
    raise exception 'SUBMISSION_NOT_FOUND: submission % does not exist', p_submission_id;
  end if;
  if v_submission.status <> 'menunggu' then
    raise exception 'SUBMISSION_NOT_PENDING: this submission was already verified';
  end if;

  select * into v_content from public.contents where id = v_submission.content_id for update;
  select * into v_assignment from public.campaign_creators where id = v_content.campaign_creator_id;
  select * into v_campaign from public.campaigns where id = v_assignment.campaign_id for update;

  perform public.assert_campaign_editable(v_campaign.id);

  if v_campaign.payout_model <> 'per_views' then
    raise exception 'CLIP_NOT_PER_VIEWS: package metrics are verified on the Metrik tab';
  end if;
  if v_content.review_status <> 'disetujui' then
    raise exception 'VIEWS_UPDATE_NOT_ALLOWED: verify the clip itself first';
  end if;

  perform set_config('app.submission_review', 'on', true);

  if not p_accept then
    if v_notes = '' then
      raise exception 'SUBMISSION_REJECT_NEEDS_NOTES: tell the klipper why it was rejected';
    end if;
    update public.metric_submissions
      set status = 'ditolak',
          review_notes = v_notes,
          reviewed_by = (select auth.uid()),
          reviewed_at = now()
      where id = p_submission_id;
    perform set_config('app.submission_review', 'off', true);
    return null;
  end if;

  if p_verified_views is null or p_verified_views < 0 then
    raise exception 'CLIP_NEEDS_VERIFIED_VIEWS: enter the verified views';
  end if;

  insert into public.metric_snapshots (
    content_id, checkpoint, captured_at, views, likes, comments, shares, saves, proof_path
  )
  values (
    v_content.id, 'lainnya', v_submission.captured_at, p_verified_views, v_submission.likes,
    v_submission.comments, v_submission.shares, v_submission.saves, v_submission.proof_path
  )
  returning id into v_snapshot_id;

  update public.metric_submissions
    set status = 'diterima',
        review_notes = v_notes,
        reviewed_by = (select auth.uid()),
        reviewed_at = now(),
        snapshot_id = v_snapshot_id,
        verified_views = p_verified_views,
        credited_amount = coalesce(p_credit, 0),
        credit_limited = coalesce(p_credit_limited, false)
    where id = p_submission_id;
  perform set_config('app.submission_review', 'off', true);

  perform set_config('app.clip_write', 'on', true);
  update public.contents set verified_views = p_verified_views where id = v_content.id;
  perform set_config('app.clip_write', 'off', true);

  perform public.record_clip_credit(
    v_campaign.id, v_content.id, v_assignment.creator_id, p_submission_id, p_verified_views, coalesce(p_credit, 0)
  );

  return v_snapshot_id;
end;
$$;

-- FR-M18-06 (`dihapus`, both roles) and FR-M18-07 (`kecurangan`, owner only).
-- Returns the amount taken back.
create or replace function public.cancel_clip(
  p_content_id uuid,
  p_kind text,
  p_removed_at timestamptz default null,
  p_rejection_reason public.clip_rejection_reason default null,
  p_notes text default ''
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  v_assignment public.campaign_creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_notes text := coalesce(trim(p_notes), '');
  v_amount bigint := 0;
begin
  if not public.is_active_member() then
    raise exception 'CLIP_INTERNAL_ONLY: only the team verifies clips';
  end if;
  if p_kind not in ('dihapus', 'kecurangan') then
    raise exception 'CLIP_CANCEL_KIND: unknown cancellation kind %', p_kind;
  end if;

  select * into v_content from public.contents where id = p_content_id for update;
  if not found then
    raise exception 'CONTENT_NOT_FOUND: content % does not exist', p_content_id;
  end if;
  select * into v_assignment from public.campaign_creators where id = v_content.campaign_creator_id;
  select * into v_campaign from public.campaigns where id = v_assignment.campaign_id for update;

  perform public.assert_campaign_editable(v_campaign.id);

  if v_campaign.payout_model <> 'per_views' then
    raise exception 'CLIP_NOT_PER_VIEWS: package content is handled on the Konten tab';
  end if;
  if v_content.review_status <> 'disetujui' then
    raise exception 'CLIP_NOT_APPROVED: only an approved clip can be cancelled';
  end if;

  perform set_config('app.clip_write', 'on', true);
  perform set_config('app.submission_review', 'on', true);

  if p_kind = 'dihapus' then
    if v_content.live_status <> 'tayang' then
      raise exception 'CLIP_NOT_LIVE: the clip is not live';
    end if;
    if p_removed_at is null or p_removed_at > now() + interval '5 minutes' then
      raise exception 'CLIP_REMOVED_AT_INVALID: enter when the clip was taken down';
    end if;

    update public.contents
      set live_status = 'dihapus', removed_at = p_removed_at
      where id = p_content_id;

    -- Mirrors removedBeforeMinLive() in lib/calculations/clip-earning.ts.
    if p_removed_at < v_content.posted_at + make_interval(days => v_campaign.min_live_days) then
      v_amount := public.record_clip_cancellation(
        v_campaign.id, p_content_id, v_assignment.creator_id,
        'Klip dihapus sebelum minimal hari tayang'
      );
    end if;
  else
    if not public.is_owner() then
      raise exception 'OWNER_ONLY: only an owner can cancel a clip for fraud';
    end if;
    if v_notes = '' then
      raise exception 'CLIP_REJECT_NEEDS_NOTES: tell the klipper why the clip was rejected';
    end if;

    -- Offline first: FR-M6-04 keeps a live URL for approved content only, and
    -- metrics then stop counting the clip.
    update public.contents
      set posted_url = null, posted_at = null, live_status = 'belum_tayang', removed_at = null
      where id = p_content_id;

    perform set_config('app.clip_review', 'fraud', true);
    insert into public.content_reviews (content_id, decision, checklist, notes)
    values (p_content_id, 'ditolak', '{}'::jsonb, v_notes);
    perform set_config('app.clip_review', '', true);

    update public.contents
      set rejection_reason = coalesce(p_rejection_reason, 'views_tidak_wajar')
      where id = p_content_id;
    update public.metric_submissions
      set status = 'ditolak', review_notes = v_notes, reviewed_by = (select auth.uid()), reviewed_at = now()
      where content_id = p_content_id and status = 'menunggu';

    v_amount := public.record_clip_cancellation(
      v_campaign.id, p_content_id, v_assignment.creator_id, v_notes
    );
  end if;

  perform set_config('app.submission_review', 'off', true);
  perform set_config('app.clip_write', 'off', true);
  return v_amount;
end;
$$;

revoke execute on function public.verify_clip(uuid, public.review_decision, jsonb, text, public.clip_rejection_reason, bigint, bigint, boolean) from public, anon;
revoke execute on function public.verify_views_update(uuid, boolean, bigint, text, bigint, boolean) from public, anon;
revoke execute on function public.cancel_clip(uuid, text, timestamptz, public.clip_rejection_reason, text) from public, anon;
grant execute on function public.verify_clip(uuid, public.review_decision, jsonb, text, public.clip_rejection_reason, bigint, bigint, boolean) to authenticated;
grant execute on function public.verify_views_update(uuid, boolean, bigint, text, bigint, boolean) to authenticated;
grant execute on function public.cancel_clip(uuid, text, timestamptz, public.clip_rejection_reason, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Withdrawing from a campaign cancels the clips still waiting
--    (FR-M17-05, left over from Phase 16).
-- ---------------------------------------------------------------------------
create or replace function public.withdraw_pending_clips()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content_id uuid;
  v_note constant text := 'Klipper mundur dari kampanye.';
begin
  if new.status <> 'mundur' or old.status = 'mundur' then
    return null;
  end if;

  for v_content_id in
    select id from public.contents
    where campaign_creator_id = new.id and review_status in ('menunggu_review', 'revisi')
  loop
    perform set_config('app.clip_review', 'withdraw', true);
    insert into public.content_reviews (content_id, decision, notes)
    values (v_content_id, 'ditolak', v_note);
    perform set_config('app.clip_review', '', true);

    perform set_config('app.clip_write', 'on', true);
    perform set_config('app.submission_review', 'on', true);
    update public.contents set rejection_reason = 'lainnya' where id = v_content_id;
    update public.metric_submissions
      set status = 'ditolak', review_notes = v_note, reviewed_at = now()
      where content_id = v_content_id and status = 'menunggu';
    perform set_config('app.submission_review', 'off', true);
    perform set_config('app.clip_write', 'off', true);
  end loop;

  return null;
end;
$$;

create trigger campaign_creators_withdraw_pending_clips
  after update of status on public.campaign_creators
  for each row
  execute function public.withdraw_pending_clips();

-- ---------------------------------------------------------------------------
-- 10. Portal read surface. New columns are appended, so `create or replace
--     view` accepts them. The internal checklist and caption check stay out.
-- ---------------------------------------------------------------------------
create or replace view public.creator_portal_contents
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
  c.updated_at,
  c.verified_views,
  c.rejection_reason,
  public.clip_credited_amount(c.id) as earned_amount
from public.contents c
join public.campaign_creators cc on cc.id = c.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_contents is
  'FR-M13-05, FR-M18: the klipper''s own content and clips, with review status, verified views and the honor credited per clip.';

create or replace view public.creator_portal_submissions
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
  s.created_at,
  s.verified_views,
  s.credited_amount,
  s.credit_limited
from public.metric_submissions s
join public.contents c on c.id = s.content_id
join public.campaign_creators cc on cc.id = c.campaign_creator_id
where cc.creator_id = public.current_creator_id();

comment on view public.creator_portal_submissions is
  'FR-M13-06, FR-M18-05: the klipper''s own submissions, how they were verified and what they credited.';
