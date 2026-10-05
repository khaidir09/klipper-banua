


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."asset_type" AS ENUM (
    'video',
    'foto',
    'dokumen',
    'tautan'
);


ALTER TYPE "public"."asset_type" OWNER TO "postgres";


CREATE TYPE "public"."assignment_join_source" AS ENUM (
    'mandiri',
    'tim'
);


ALTER TYPE "public"."assignment_join_source" OWNER TO "postgres";


CREATE TYPE "public"."assignment_status" AS ENUM (
    'diundang',
    'bergabung',
    'mundur',
    'selesai'
);


ALTER TYPE "public"."assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."campaign_access" AS ENUM (
    'terbuka',
    'undangan'
);


ALTER TYPE "public"."campaign_access" OWNER TO "postgres";


CREATE TYPE "public"."campaign_objective" AS ENUM (
    'pendaftar',
    'awareness',
    'event'
);


ALTER TYPE "public"."campaign_objective" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status" AS ENUM (
    'draft',
    'aktif',
    'selesai',
    'dibatalkan'
);


ALTER TYPE "public"."campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."client_payment_status" AS ENUM (
    'belum_dibayar',
    'sebagian',
    'lunas'
);


ALTER TYPE "public"."client_payment_status" OWNER TO "postgres";


CREATE TYPE "public"."client_type" AS ENUM (
    'brand',
    'umkm',
    'instansi',
    'personal',
    'lainnya'
);


ALTER TYPE "public"."client_type" OWNER TO "postgres";


CREATE TYPE "public"."clip_rejection_reason" AS ENUM (
    'bukan_pemilik',
    'langgar_brief',
    'di_luar_periode',
    'duplikat',
    'views_tidak_wajar',
    'lainnya'
);


ALTER TYPE "public"."clip_rejection_reason" OWNER TO "postgres";


CREATE TYPE "public"."creator_status" AS ENUM (
    'prospek',
    'terverifikasi',
    'aktif',
    'nonaktif',
    'diblokir'
);


ALTER TYPE "public"."creator_status" OWNER TO "postgres";


CREATE TYPE "public"."creator_tier" AS ENUM (
    'nano',
    'mikro',
    'menengah'
);


ALTER TYPE "public"."creator_tier" OWNER TO "postgres";


CREATE TYPE "public"."ledger_entry_type" AS ENUM (
    'honor_klip',
    'pembatalan',
    'penyesuaian',
    'penarikan',
    'pengembalian_penarikan'
);


ALTER TYPE "public"."ledger_entry_type" OWNER TO "postgres";


CREATE TYPE "public"."live_status" AS ENUM (
    'belum_tayang',
    'tayang',
    'dihapus'
);


ALTER TYPE "public"."live_status" OWNER TO "postgres";


CREATE TYPE "public"."metric_checkpoint" AS ENUM (
    'H+1',
    'H+3',
    'H+7',
    'akhir',
    'lainnya'
);


ALTER TYPE "public"."metric_checkpoint" OWNER TO "postgres";


CREATE TYPE "public"."ops_activity" AS ENUM (
    'review',
    'rekap_metrik',
    'koordinasi_kreator',
    'koordinasi_klien',
    'pembayaran',
    'laporan',
    'lainnya',
    'verifikasi_klip',
    'penarikan'
);


ALTER TYPE "public"."ops_activity" OWNER TO "postgres";


CREATE TYPE "public"."payout_model" AS ENUM (
    'per_views',
    'paket'
);


ALTER TYPE "public"."payout_model" OWNER TO "postgres";


CREATE TYPE "public"."payout_status" AS ENUM (
    'draf',
    'disetujui',
    'dibayar'
);


ALTER TYPE "public"."payout_status" OWNER TO "postgres";


CREATE TYPE "public"."review_decision" AS ENUM (
    'disetujui',
    'revisi',
    'ditolak'
);


ALTER TYPE "public"."review_decision" OWNER TO "postgres";


CREATE TYPE "public"."review_status" AS ENUM (
    'menunggu_review',
    'disetujui',
    'revisi',
    'ditolak'
);


ALTER TYPE "public"."review_status" OWNER TO "postgres";


CREATE TYPE "public"."signup_source" AS ENUM (
    'undangan',
    'mandiri'
);


ALTER TYPE "public"."signup_source" OWNER TO "postgres";


CREATE TYPE "public"."social_platform" AS ENUM (
    'tiktok',
    'instagram',
    'youtube',
    'facebook'
);


ALTER TYPE "public"."social_platform" OWNER TO "postgres";


CREATE TYPE "public"."submission_status" AS ENUM (
    'menunggu',
    'diterima',
    'ditolak'
);


ALTER TYPE "public"."submission_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'owner',
    'manager',
    'creator',
    'client'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."withdrawal_status" AS ENUM (
    'diajukan',
    'diproses',
    'dibayar',
    'ditolak'
);


ALTER TYPE "public"."withdrawal_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_creator_terms"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  me uuid := public.current_creator_id();
  v_version text := public.current_creator_terms_version();
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no creator for this account';
  end if;

  update public.creators
  set terms_version = v_version,
      terms_agreed_at = now()
  where id = me
    and terms_version is distinct from v_version;

  if found then
    insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
    values ((select auth.uid()), 'creator', me, 'accept_terms', jsonb_build_object('terms_version', v_version));
  end if;

  return v_version;
end;
$$;


ALTER FUNCTION "public"."accept_creator_terms"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."activate_self_registered_creator"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.creators
  set status = 'aktif'
  where id = new.creator_id
    and status = 'prospek'
    and signup_source = 'mandiri';
  return new;
end;
$$;


ALTER FUNCTION "public"."activate_self_registered_creator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."adjust_balance"("p_creator_id" "uuid", "p_amount" bigint, "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id uuid;
begin
  if not public.is_owner() then
    raise exception 'OWNER_ONLY: only an owner adjusts a balance';
  end if;
  if p_amount is null or p_amount = 0 then
    raise exception 'ADJUSTMENT_INVALID: the amount cannot be zero';
  end if;
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'ADJUSTMENT_NEEDS_REASON: an adjustment needs a reason';
  end if;

  perform 1 from public.creators where id = p_creator_id for update;
  if not found then
    raise exception 'CREATOR_NOT_FOUND: creator % does not exist', p_creator_id;
  end if;

  perform set_config('app.ledger_write', 'on', true);
  insert into public.creator_ledger_entries (creator_id, entry_type, amount, notes, created_by)
  values (p_creator_id, 'penyesuaian', p_amount, trim(p_reason), (select auth.uid()))
  returning id into v_id;
  perform set_config('app.ledger_write', 'off', true);

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'creator_ledger_entry', v_id, 'ledger_adjust',
    jsonb_build_object('creator_id', p_creator_id, 'amount', p_amount, 'reason', trim(p_reason))
  );
  return v_id;
end;
$$;


ALTER FUNCTION "public"."adjust_balance"("p_creator_id" "uuid", "p_amount" bigint, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."anonymize_creator"("target_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  proof_paths text[];
  label text;
  portal_profile_id uuid;
begin
  if not public.is_owner() then
    raise exception 'OWNER_ONLY: only an owner can anonymize a creator';
  end if;

  if not exists (select 1 from public.creators where id = target_id) then
    raise exception 'CREATOR_NOT_FOUND: creator does not exist';
  end if;

  if exists (select 1 from public.creators where id = target_id and anonymized_at is not null) then
    raise exception 'CREATOR_ANONYMIZED: this creator''s data was erased';
  end if;

  select coalesce(array_agg(audience_proof_path), '{}')
    into proof_paths
    from public.creator_social_accounts
    where creator_id = target_id and audience_proof_path is not null;

  select profile_id into portal_profile_id from public.creators where id = target_id;

  delete from public.creator_social_accounts where creator_id = target_id;
  delete from public.creator_bank_accounts where creator_id = target_id;

  label := 'Kreator anonim ' || upper(right(replace(target_id::text, '-', ''), 6));

  update public.creators
    set full_name = label,
        stage_name = '',
        phone_wa = '',
        email = '',
        city = '',
        birth_date = null,
        notes = '',
        status = 'diblokir',
        -- Keeps an earlier block reason (e.g. proven fraud); otherwise says why.
        blocked_reason = coalesce(nullif(trim(blocked_reason), ''), 'Data pribadi dianonimkan'),
        profile_id = null,
        portal_invited_at = null,
        anonymized_at = now()
    where id = target_id;

  -- The portal account holds the creator's email: it goes with the rest.
  if portal_profile_id is not null then
    delete from auth.users where id = portal_profile_id;
  end if;

  update public.activity_logs
    set details = details - 'full_name' - 'stage_name' - 'phone_wa' - 'email'
    where entity_type = 'creator' and entity_id = target_id;

  return proof_paths;
end;
$$;


ALTER FUNCTION "public"."anonymize_creator"("target_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_content_review"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."apply_content_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_campaign_editable"("p_campaign_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_status public.campaign_status;
begin
  if (select auth.uid()) is null or public.is_owner() then
    return;
  end if;

  select status into v_status from public.campaigns where id = p_campaign_id;
  if v_status in ('selesai', 'dibatalkan') then
    raise exception 'CAMPAIGN_LOCKED: only an owner can change a closed campaign';
  end if;
end;
$$;


ALTER FUNCTION "public"."assert_campaign_editable"("p_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assert_clip_has_submission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."assert_clip_has_submission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assignment_payout_model"("target_assignment_id" "uuid") RETURNS "public"."payout_model"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select c.payout_model
  from public.campaign_creators cc
  join public.campaigns c on c.id = cc.campaign_id
  where cc.id = target_assignment_id;
$$;


ALTER FUNCTION "public"."assignment_payout_model"("target_assignment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."campaign_budget_exhausted"("target_campaign_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    (
      select c.creator_budget - public.campaign_creator_cost(c.id) < c.rate_per_1000_views
      from public.campaigns c
      where c.id = target_campaign_id
    ),
    true
  );
$$;


ALTER FUNCTION "public"."campaign_budget_exhausted"("target_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."campaign_creator_cost"("target_campaign_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(sum(amount), 0)::bigint
  from public.creator_ledger_entries
  where campaign_id = target_campaign_id
    and entry_type in ('honor_klip', 'pembatalan');
$$;


ALTER FUNCTION "public"."campaign_creator_cost"("target_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."campaign_open_for_catalog"("target_campaign_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = target_campaign_id
      and c.status = 'aktif'
      and c.access = 'terbuka'
      and c.payout_model = 'per_views'
      and c.end_date >= public.campaign_today()
  );
$$;


ALTER FUNCTION "public"."campaign_open_for_catalog"("target_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."campaign_today"() RETURNS "date"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select (now() at time zone 'Asia/Makassar')::date;
$$;


ALTER FUNCTION "public"."campaign_today"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_clip"("p_content_id" "uuid", "p_kind" "text", "p_removed_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_rejection_reason" "public"."clip_rejection_reason" DEFAULT NULL::"public"."clip_rejection_reason", "p_notes" "text" DEFAULT ''::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
      raise exception 'CLIP_REJECT_NEEDS_NOTES: tell the kliper why the clip was rejected';
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


ALTER FUNCTION "public"."cancel_clip"("p_content_id" "uuid", "p_kind" "text", "p_removed_at" timestamp with time zone, "p_rejection_reason" "public"."clip_rejection_reason", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_campaign_objective"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.payout_model = 'per_views' then
    new.objective := null;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."clear_campaign_objective"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."client_owns_campaign"("target_campaign_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.campaigns c
    where c.id = target_campaign_id
      and c.client_id = public.current_client_id()
      and c.status in ('aktif', 'selesai')
  );
$$;


ALTER FUNCTION "public"."client_owns_campaign"("target_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clip_credited_amount"("target_content_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(sum(amount), 0)::bigint
  from public.creator_ledger_entries
  where content_id = target_content_id
    and entry_type in ('honor_klip', 'pembatalan');
$$;


ALTER FUNCTION "public"."clip_credited_amount"("target_content_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."content_campaign_id"("p_campaign_creator_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select campaign_id from public.campaign_creators where id = p_campaign_creator_id;
$$;


ALTER FUNCTION "public"."content_campaign_id"("p_campaign_creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_assigned_to_campaign"("target_campaign_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.campaign_creators cc
    join public.campaigns c on c.id = cc.campaign_id
    where cc.campaign_id = target_campaign_id
      and cc.creator_id = public.current_creator_id()
      and c.status in ('aktif', 'selesai')
  );
$$;


ALTER FUNCTION "public"."creator_assigned_to_campaign"("target_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_balance"("target_creator_id" "uuid") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(sum(amount), 0)::bigint
  from public.creator_ledger_entries
  where creator_id = target_creator_id;
$$;


ALTER FUNCTION "public"."creator_balance"("target_creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_can_view_campaign_assets"("target_campaign_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select public.creator_assigned_to_campaign(target_campaign_id)
    or (
      public.campaign_open_for_catalog(target_campaign_id)
      and exists (
        select 1 from public.creators c
        where c.id = public.current_creator_id()
          and c.status in ('aktif', 'terverifikasi')
      )
    );
$$;


ALTER FUNCTION "public"."creator_can_view_campaign_assets"("target_campaign_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_joined_assignment"("target_assignment_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.campaign_creators cc
    join public.campaigns c on c.id = cc.campaign_id
    where cc.id = target_assignment_id
      and cc.creator_id = public.current_creator_id()
      and c.status = 'aktif'
      and cc.status in ('bergabung', 'selesai')
  );
$$;


ALTER FUNCTION "public"."creator_joined_assignment"("target_assignment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_joined_content"("target_content_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.contents ct
    join public.campaign_creators cc on cc.id = ct.campaign_creator_id
    where ct.id = target_content_id
      and cc.creator_id = public.current_creator_id()
      and cc.status in ('bergabung', 'selesai')
  );
$$;


ALTER FUNCTION "public"."creator_joined_content"("target_content_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_owns_assignment"("target_assignment_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.campaign_creators cc
    join public.campaigns c on c.id = cc.campaign_id
    where cc.id = target_assignment_id
      and cc.creator_id = public.current_creator_id()
      and c.status = 'aktif'
  );
$$;


ALTER FUNCTION "public"."creator_owns_assignment"("target_assignment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_owns_content"("target_content_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.contents ct
    join public.campaign_creators cc on cc.id = ct.campaign_creator_id
    where ct.id = target_content_id
      and cc.creator_id = public.current_creator_id()
  );
$$;


ALTER FUNCTION "public"."creator_owns_content"("target_content_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_client_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select cc.client_id
  from public.client_contacts cc
  join public.profiles p on p.id = cc.profile_id
  where p.id = (select auth.uid())
    and p.is_active
    and p.role = 'client'
  limit 1;
$$;


ALTER FUNCTION "public"."current_client_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_creator_account_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select c.id
  from public.creators c
  join public.profiles p on p.id = c.profile_id
  where p.id = (select auth.uid())
    and p.is_active
    and p.role = 'creator'
    and c.anonymized_at is null
  limit 1;
$$;


ALTER FUNCTION "public"."current_creator_account_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_creator_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select c.id
  from public.creators c
  join public.profiles p on p.id = c.profile_id
  where p.id = (select auth.uid())
    and p.is_active
    and p.role = 'creator'
    and c.status <> 'diblokir'
    and c.anonymized_at is null
  limit 1;
$$;


ALTER FUNCTION "public"."current_creator_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_creator_terms_version"() RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select '2026-10'::text;
$$;


ALTER FUNCTION "public"."current_creator_terms_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_min_withdrawal"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce((select min_withdrawal from public.platform_settings where id), 100000);
$$;


ALTER FUNCTION "public"."current_min_withdrawal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select role from public.profiles where id = (select auth.uid());
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.campaign_creators cc where cc.referral_code = code
    );
  end loop;
  return code;
end;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_tracking_slug"("stage_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  base text;
  suffix text;
  slug text;
  suffix_length int;
begin
  base := regexp_replace(lower(coalesce(stage_name, '')), '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '^-+|-+$', '', 'g');
  base := regexp_replace(left(base, 20), '-+$', '');
  suffix_length := case when length(base) >= 3 then 4 else 8 end;

  loop
    suffix := '';
    for i in 1..suffix_length loop
      suffix := suffix || substr(alphabet, 1 + floor(random() * 31)::int, 1);
    end loop;
    slug := case when length(base) >= 3 then base || '-' || suffix else suffix end;
    exit when not exists (
      select 1 from public.campaign_creators cc where cc.tracking_slug = slug
    );
  end loop;
  return slug;
end;
$_$;


ALTER FUNCTION "public"."generate_tracking_slug"("stage_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_verification_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := 'KB-';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from public.creators c where c.verification_code = code);
  end loop;
  return code;
end;
$$;


ALTER FUNCTION "public"."generate_verification_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_masked_bank_account"("p_creator_id" "uuid") RETURNS TABLE("bank_name" "text", "account_number_masked" "text", "holder_matches_name" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    b.bank_name,
    repeat('*', greatest(length(b.account_number) - 4, 0)) || right(b.account_number, 4),
    b.holder_matches_name
  from public.creator_bank_accounts b
  where b.creator_id = p_creator_id
    and public.is_active_member();
$$;


ALTER FUNCTION "public"."get_masked_bank_account"("p_creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_anonymized_creator"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_table_name = 'creators' then
    if old.anonymized_at is not null then
      raise exception 'CREATOR_ANONYMIZED: this creator''s data was erased';
    end if;
    return new;
  end if;

  if exists (
    select 1 from public.creators c
    where c.id = new.creator_id and c.anonymized_at is not null
  ) then
    raise exception 'CREATOR_ANONYMIZED: this creator''s data was erased';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."guard_anonymized_creator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_campaign_asset_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."guard_campaign_asset_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_campaign_creator_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_creator public.creators%rowtype;
  v_campaign public.campaigns%rowtype;
  v_portal_creator uuid := public.current_creator_id();
begin
  perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));

  if tg_op = 'DELETE' then
    return old;
  end if;

  select * into v_creator from public.creators where id = new.creator_id;

  -- A kliper joining from the catalog. Checked in the order the portal
  -- explains them (lib/campaigns/open.ts joinBlockers).
  if tg_op = 'INSERT' and v_portal_creator is not null then
    if new.creator_id is distinct from v_portal_creator then
      raise exception 'PORTAL_FIELD_LOCKED: a kliper can only join for themselves';
    end if;

    if num_nonnulls(new.base_fee, new.bonus_per_1000_views, new.bonus_per_registrant, new.views_bonus_cap) > 0 then
      raise exception 'PORTAL_FIELD_LOCKED: fee columns belong to the team';
    end if;

    select * into v_campaign from public.campaigns where id = new.campaign_id;

    if v_creator.status not in ('aktif', 'terverifikasi') then
      raise exception 'JOIN_CREATOR_NOT_ACTIVE: add a social account before joining';
    end if;

    if v_creator.terms_version is distinct from public.current_creator_terms_version() then
      raise exception 'JOIN_TERMS_OUTDATED: accept the latest terms first';
    end if;

    if v_campaign.id is null
      or v_campaign.status <> 'aktif'
      or v_campaign.access <> 'terbuka'
      or v_campaign.payout_model <> 'per_views'
    then
      raise exception 'JOIN_CAMPAIGN_CLOSED: the campaign is not open for joining';
    end if;

    if v_campaign.end_date < public.campaign_today() then
      raise exception 'JOIN_PAST_DEADLINE: the campaign has ended';
    end if;

    if public.campaign_budget_exhausted(v_campaign.id) then
      raise exception 'JOIN_BUDGET_EXHAUSTED: the campaign budget is used up';
    end if;

    if v_campaign.local_only and v_creator.verified_at is null then
      raise exception 'JOIN_LOCAL_ONLY: this campaign is for Kliper Lokal badge holders';
    end if;

    -- Everything else on the row comes from the server, whatever was sent.
    new.status := 'bergabung';
    new.join_source := 'mandiri';
    new.joined_at := now();
    new.creator_confirmed_at := now();
    new.withdrawn_at := null;
    new.contents_committed := v_campaign.max_clips_per_creator;
    new.referral_code := public.generate_referral_code();
    new.tracking_slug := public.generate_tracking_slug(v_creator.stage_name);
    new.created_by := (select auth.uid());
    return new;
  end if;

  if v_creator.status = 'diblokir' then
    raise exception 'CREATOR_BLOCKED: a blocked creator cannot be assigned';
  end if;

  if tg_op = 'INSERT' and v_creator.status not in ('terverifikasi', 'aktif') then
    raise exception 'CREATOR_NOT_VERIFIED: only verified or active creators can be assigned';
  end if;

  if tg_op = 'UPDATE'
    and (new.referral_code is distinct from old.referral_code
      or new.tracking_slug is distinct from old.tracking_slug)
    and (
      exists (select 1 from public.link_clicks where campaign_creator_id = old.id)
      or exists (select 1 from public.registrant_reports where campaign_creator_id = old.id)
    )
  then
    raise exception 'TRACKING_FROZEN: code and slug cannot change after clicks or registrant reports';
  end if;

  -- The withdrawal stamp follows the status, whoever changes it.
  if new.status = 'mundur' then
    new.withdrawn_at := case
      when tg_op = 'UPDATE' and old.status = 'mundur' then old.withdrawn_at
      else coalesce(new.withdrawn_at, now())
    end;
  else
    new.withdrawn_at := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_campaign_creator_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_campaign_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  new.published_at := null;
  if (select auth.uid()) is not null and new.payout_model = 'paket' then
    raise exception 'PAKET_RETIRED: new campaigns use the per_views payout model';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."guard_campaign_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_campaign_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  -- The trigger owns the publication stamp: set once, on the first time the
  -- campaign runs as an open campaign.
  new.published_at := case
    when new.status = 'aktif' and new.access = 'terbuka' then coalesce(old.published_at, now())
    else old.published_at
  end;

  if (select auth.uid()) is null then
    return new;
  end if;

  if old.status in ('selesai', 'dibatalkan') and not public.is_owner() then
    raise exception 'CAMPAIGN_LOCKED: only an owner can change a closed campaign';
  end if;

  if new.payout_model is distinct from old.payout_model then
    if new.payout_model = 'paket' then
      raise exception 'PAKET_RETIRED: new campaigns use the per_views payout model';
    end if;
    if old.status <> 'draft' then
      raise exception 'PAYOUT_MODEL_LOCKED: the payout model is fixed once the campaign is active';
    end if;
  end if;

  if new.rate_per_1000_views is distinct from old.rate_per_1000_views
    and exists (
      select 1
      from public.contents ct
      join public.campaign_creators cc on cc.id = ct.campaign_creator_id
      where cc.campaign_id = old.id and ct.review_status = 'disetujui'
    )
  then
    raise exception 'RATE_LOCKED: the rate cannot change after a clip was approved';
  end if;

  if new.creator_budget < old.creator_budget
    and new.creator_budget < public.campaign_creator_cost(old.id)
  then
    raise exception 'BUDGET_BELOW_USED: the budget cannot go below the honor already spent';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('aktif', 'dibatalkan'))
      or (old.status = 'aktif' and new.status in ('selesai', 'dibatalkan'))
    ) then
      raise exception 'INVALID_TRANSITION: % -> % is not allowed', old.status, new.status;
    end if;

    if new.status = 'aktif' then
      if new.objective = 'pendaftar' and coalesce(trim(new.landing_url), '') = '' then
        raise exception 'ACTIVATION_NEEDS_LANDING_URL: registration campaigns need a landing URL';
      end if;

      if new.payout_model = 'per_views' then
        if coalesce(trim(new.brief), '') = '' then
          raise exception 'ACTIVATION_NEEDS_BRIEF: the brief is empty';
        end if;
        if not exists (select 1 from public.campaign_assets a where a.campaign_id = new.id) then
          raise exception 'ACTIVATION_NEEDS_ASSET: at least one campaign asset is required';
        end if;
        if new.rate_per_1000_views <= 0 then
          raise exception 'ACTIVATION_NEEDS_RATE: the rate per 1,000 views must be above zero';
        end if;
        if new.creator_budget <= 0 then
          raise exception 'ACTIVATION_NEEDS_BUDGET: the kliper budget must be above zero';
        end if;
        if new.end_date < public.campaign_today() then
          raise exception 'ACTIVATION_PAST_END_DATE: the end date has passed';
        end if;
        if cardinality(new.allowed_platforms) = 0 then
          raise exception 'ACTIVATION_NEEDS_PLATFORM: pick at least one platform';
        end if;
      end if;

      -- FR-M4-02: an open campaign may start without klipers.
      if new.access = 'undangan' and not exists (
        select 1 from public.campaign_creators
        where campaign_id = new.id and status in ('diundang', 'bergabung')
      ) then
        raise exception 'ACTIVATION_NEEDS_CREATOR: at least one creator must be assigned';
      end if;
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_campaign_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_client_payment_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'DELETE' then
    if (select auth.uid()) is not null and not public.is_owner() then
      raise exception 'FINANCE_OWNER_ONLY: only an owner can delete a client payment';
    end if;
    return old;
  end if;

  if (select auth.uid()) is not null
    and not public.is_owner()
    and new.proof_path is distinct from (case when tg_op = 'UPDATE' then old.proof_path else null end)
  then
    raise exception 'FINANCE_OWNER_ONLY: only an owner can attach payment proofs';
  end if;

  new.status := case
    when new.paid_amount <= 0 then 'belum_dibayar'
    when new.paid_amount >= new.amount then 'lunas'
    else 'sebagian'
  end::public.client_payment_status;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_client_payment_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_clip_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
    raise exception 'CLIP_CREATOR_NOT_ACTIVE: the kliper account is not active';
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
    coalesce(date_trunc('minute', v_assignment.joined_at), '-infinity'::timestamptz),
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
    raise exception 'CLIP_LIMIT_REACHED: the kliper already sent the maximum number of clips';
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


ALTER FUNCTION "public"."guard_clip_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_content_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."guard_content_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_content_review_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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

  -- A withdrawal is the kliper's own act, not a reviewer's decision.
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


ALTER FUNCTION "public"."guard_content_review_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_creator_anonymize_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if old.anonymized_at is null and new.anonymized_at is not null then
    if public.creator_balance(new.id) <> 0 then
      raise exception 'ANONYMIZE_BALANCE_NOT_ZERO: settle the balance before deleting the account';
    end if;
    if exists (
      select 1 from public.withdrawals
      where creator_id = new.id and status in ('diajukan', 'diproses')
    ) then
      raise exception 'ANONYMIZE_WITHDRAWAL_OPEN: finish the withdrawal before deleting the account';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."guard_creator_anonymize_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_creator_block"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.status = 'diblokir' and old.status is distinct from 'diblokir' then
    new.blocked_at := now();
  elsif old.status = 'diblokir' and new.status <> 'diblokir' then
    if (select auth.uid()) is not null and not public.is_owner() then
      raise exception 'OWNER_ONLY: only an owner can unblock a creator';
    end if;
    new.blocked_at := null;
    new.blocked_reason := null;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."guard_creator_block"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_ledger_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."guard_ledger_entry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_metric_snapshot_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_content public.contents%rowtype;
begin
  select * into v_content from public.contents where id = coalesce(new.content_id, old.content_id);

  if (select auth.uid()) is not null then
    perform public.assert_campaign_editable(public.content_campaign_id(v_content.campaign_creator_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if v_content.posted_at is null or v_content.live_status = 'belum_tayang' then
    raise exception 'SNAPSHOT_NEEDS_LIVE_CONTENT: metrics are recorded for live content only';
  end if;

  if new.captured_at < v_content.posted_at then
    raise exception 'SNAPSHOT_BEFORE_POSTING: captured_at cannot precede posted_at';
  end if;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.entered_by := (select auth.uid());
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_metric_snapshot_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_metric_submission_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."guard_metric_submission_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_ops_time_log_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.campaign_id is distinct from old.campaign_id
    or new.user_id is distinct from old.user_id then
    raise exception 'OPS_LOG_OWNER_FIXED: campaign and user of a time log cannot change';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."guard_ops_time_log_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_payout_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_campaign_status public.campaign_status;
  v_amounts_changed boolean;
begin
  if (select auth.uid()) is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.status <> 'draf' or not public.is_owner() then
      raise exception 'PAYOUT_LOCKED: only an owner can delete a draft payout';
    end if;
    return old;
  end if;

  select c.status into v_campaign_status
  from public.campaign_creators cc
  join public.campaigns c on c.id = cc.campaign_id
  where cc.id = new.campaign_creator_id;

  if tg_op = 'INSERT' then
    if v_campaign_status <> 'selesai' then
      raise exception 'PAYOUT_NEEDS_CLOSED_CAMPAIGN: payouts are calculated once the campaign is selesai';
    end if;
    new.status := 'draf';
    new.approved_by := null;
    new.approved_at := null;
    new.paid_at := null;
    new.transfer_proof_path := null;
    new.created_by := (select auth.uid());
    return new;
  end if;

  if new.campaign_creator_id is distinct from old.campaign_creator_id then
    raise exception 'PAYOUT_LOCKED: a payout cannot move to another assignment';
  end if;

  v_amounts_changed :=
    new.base_amount is distinct from old.base_amount
    or new.views_bonus is distinct from old.views_bonus
    or new.registrant_bonus is distinct from old.registrant_bonus
    or new.adjustment_amount is distinct from old.adjustment_amount
    or new.adjustment_reason is distinct from old.adjustment_reason
    or new.total_amount is distinct from old.total_amount
    or new.calculation_snapshot is distinct from old.calculation_snapshot;

  -- FR-M8-04: only drafts are recalculated or adjusted.
  if v_amounts_changed and old.status <> 'draf' then
    raise exception 'PAYOUT_LOCKED: only draft payouts can be recalculated or adjusted';
  end if;

  if new.status is distinct from old.status then
    -- FR-M8-03: status changes are owner-only.
    if not public.is_owner() then
      raise exception 'PAYOUT_OWNER_ONLY: only an owner can approve or mark a payout as paid';
    end if;
    if not (
      (old.status = 'draf' and new.status = 'disetujui')
      or (old.status = 'disetujui' and new.status in ('dibayar', 'draf'))
    ) then
      raise exception 'INVALID_PAYOUT_TRANSITION: % -> % is not allowed', old.status, new.status;
    end if;
    if new.status = 'disetujui' and old.status = 'draf' then
      new.approved_by := (select auth.uid());
      new.approved_at := now();
    elsif new.status = 'draf' then
      new.approved_by := null;
      new.approved_at := null;
    end if;
  elsif new.paid_at is distinct from old.paid_at
    or new.transfer_proof_path is distinct from old.transfer_proof_path
    or new.approved_by is distinct from old.approved_by
    or new.approved_at is distinct from old.approved_at
  then
    raise exception 'PAYOUT_LOCKED: approval and payment fields change only with a status change';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_payout_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_portal_assignment_confirm"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  -- Listing what may move, instead of what may not, keeps a column added
  -- later locked by default.
  v_allowed text[] := array['status', 'joined_at', 'creator_confirmed_at', 'withdrawn_at', 'updated_at'];
  v_payout_model public.payout_model;
begin
  if public.current_creator_id() is null then
    return new;
  end if;

  if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
    raise exception 'PORTAL_FIELD_LOCKED: only the team can change that';
  end if;

  if old.status = 'diundang' and new.status = 'bergabung' then
    -- Written here, so the confirmation carries the server's clock.
    new.joined_at := coalesce(old.joined_at, now());
    new.creator_confirmed_at := now();
    new.withdrawn_at := old.withdrawn_at;
    return new;
  end if;

  if old.status = 'bergabung' and new.status = 'mundur' then
    select payout_model into v_payout_model from public.campaigns where id = old.campaign_id;
    if v_payout_model is distinct from 'per_views' then
      raise exception 'WITHDRAW_NOT_ALLOWED: ask the team to withdraw from a package campaign';
    end if;
    if exists (
      select 1 from public.contents ct
      where ct.campaign_creator_id = old.id and ct.review_status = 'disetujui'
    ) then
      raise exception 'WITHDRAW_HAS_APPROVED_CLIP: a kliper with an approved clip cannot withdraw';
    end if;
    new.joined_at := old.joined_at;
    new.creator_confirmed_at := old.creator_confirmed_at;
    new.withdrawn_at := now();
    return new;
  end if;

  raise exception 'PORTAL_CONFIRM_ONLY: the portal can only confirm an invitation or withdraw';
end;
$$;


ALTER FUNCTION "public"."guard_portal_assignment_confirm"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_portal_content_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."guard_portal_content_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_portal_social_account"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if (select auth.uid()) is null or public.is_active_member() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.last_verified_at is not null or new.badge_review_notes is not null then
      raise exception 'PORTAL_FIELD_LOCKED: verification fields belong to the team';
    end if;
    return new;
  end if;

  if new.creator_id is distinct from old.creator_id
    or new.last_verified_at is distinct from old.last_verified_at
    or new.badge_review_notes is distinct from old.badge_review_notes
  then
    -- Withdrawing the stamp alongside a new audience claim is the one change
    -- the portal may make to last_verified_at.
    if not (
      new.creator_id = old.creator_id
      and new.last_verified_at is null
      and new.badge_review_notes is not distinct from old.badge_review_notes
    ) then
      raise exception 'PORTAL_FIELD_LOCKED: verification fields belong to the team';
    end if;
  end if;

  if new.kalimantan_audience_pct is distinct from old.kalimantan_audience_pct
    or new.audience_proof_path is distinct from old.audience_proof_path
    or new.top_cities is distinct from old.top_cities
  then
    new.last_verified_at := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_portal_social_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_registrant_report_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if (select auth.uid()) is not null then
    perform public.assert_campaign_editable(coalesce(new.campaign_id, old.campaign_id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.campaign_creator_id is not null and not exists (
    select 1 from public.campaign_creators
    where id = new.campaign_creator_id and campaign_id = new.campaign_id
  ) then
    raise exception 'REPORT_ASSIGNMENT_MISMATCH: the referral code belongs to another campaign';
  end if;

  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.entered_by := (select auth.uid());
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_registrant_report_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_report_share_link"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."guard_report_share_link"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_withdrawal_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if coalesce(current_setting('app.withdrawal_write', true), '') <> 'on' then
    raise exception 'WITHDRAWAL_FUNCTION_ONLY: withdrawals change through request_withdrawal and process_withdrawal';
  end if;
  if tg_op = 'DELETE' then
    raise exception 'WITHDRAWAL_IMMUTABLE: withdrawals stay on record';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."guard_withdrawal_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  assigned_role public.user_role;
  new_creator_id uuid;
begin
  -- Never `raw_user_meta_data ->> 'role'`: see 20261001000000_creator_self_signup.sql.
  assigned_role := coalesce(
    (new.raw_app_meta_data ->> 'role')::public.user_role,
    'creator'
  );

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(meta ->> 'full_name', ''),
    assigned_role
  )
  on conflict (id) do update set email = excluded.email;

  if assigned_role = 'creator' and meta ->> 'signup' = 'mandiri' then
    if length(trim(coalesce(meta ->> 'full_name', ''))) = 0
      or length(trim(coalesce(meta ->> 'stage_name', ''))) = 0
      or length(trim(coalesce(meta ->> 'city', ''))) = 0
      or length(trim(coalesce(meta ->> 'province', ''))) = 0
      or length(trim(coalesce(meta ->> 'terms_version', ''))) = 0
      or coalesce(meta ->> 'phone_wa', '') !~ '^628[0-9]{7,12}$'
    then
      raise exception 'SIGNUP_INVALID: missing or malformed registration fields';
    end if;

    -- A taken number is refused with the same generic message as any other
    -- invalid field: the unique index would echo the number back to whoever
    -- calls the Auth API. The index still settles a race between two sign-ups.
    if exists (
      select 1 from public.creators c
      where c.phone_wa = meta ->> 'phone_wa' and c.anonymized_at is null
    ) then
      raise exception 'SIGNUP_INVALID: registration rejected';
    end if;

    -- FR-M3-02: no birth date at sign-up; it is asked before the first withdrawal.
    insert into public.creators (
      full_name, stage_name, phone_wa, email, city, province,
      status, signup_source, terms_version, terms_agreed_at, profile_id
    )
    values (
      trim(meta ->> 'full_name'),
      trim(meta ->> 'stage_name'),
      meta ->> 'phone_wa',
      coalesce(new.email, ''),
      trim(meta ->> 'city'),
      trim(meta ->> 'province'),
      'prospek',
      'mandiri',
      left(trim(meta ->> 'terms_version'), 50),
      now(),
      new.id
    )
    returning id into new_creator_id;

    -- FR-M11-01: the registration is the kliper's own first action.
    insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
    values (
      new.id,
      'creator',
      new_creator_id,
      'self_signup',
      jsonb_build_object('terms_version', left(trim(meta ->> 'terms_version'), 50))
    );
  end if;

  return new;
end;
$_$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_email_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_user_email_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_active_member"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    (
      select is_active and role in ('owner', 'manager')
      from public.profiles
      where id = (select auth.uid())
    ),
    false
  );
$$;


ALTER FUNCTION "public"."is_active_member"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_active_member"() IS 'True only for an active owner or manager. The creator portal role never passes this check (PRD M13).';



CREATE OR REPLACE FUNCTION "public"."is_owner"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(
    (select role = 'owner' and is_active from public.profiles where id = (select auth.uid())),
    false
  );
$$;


ALTER FUNCTION "public"."is_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_clip_url"("url" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "public"."normalize_clip_url"("url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_person_name"("value" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select regexp_replace(lower(trim(coalesce(value, ''))), '\s+', ' ', 'g');
$$;


ALTER FUNCTION "public"."normalize_person_name"("value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."open_report_share_link"("p_token_hash" "text") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."open_report_share_link"("p_token_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_content_review_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  raise exception 'REVIEW_IMMUTABLE: review history cannot be changed or deleted';
end;
$$;


ALTER FUNCTION "public"."prevent_content_review_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_withdrawal"("p_id" "uuid", "p_status" "public"."withdrawal_status", "p_paid_at" "date" DEFAULT NULL::"date", "p_proof_path" "text" DEFAULT NULL::"text", "p_reason" "text" DEFAULT NULL::"text", "p_transfer_fee" bigint DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_row public.withdrawals%rowtype;
begin
  if not public.is_owner() then
    raise exception 'OWNER_ONLY: only an owner processes withdrawals';
  end if;

  select * into v_row from public.withdrawals where id = p_id for update;
  if not found then
    raise exception 'WITHDRAWAL_NOT_FOUND: withdrawal % does not exist', p_id;
  end if;

  if not (
    (v_row.status = 'diajukan' and p_status in ('diproses', 'ditolak'))
    or (v_row.status = 'diproses' and p_status in ('dibayar', 'ditolak'))
  ) then
    raise exception 'INVALID_WITHDRAWAL_TRANSITION: % -> % is not allowed', v_row.status, p_status;
  end if;

  if p_status = 'dibayar' and (p_paid_at is null or length(trim(coalesce(p_proof_path, ''))) = 0) then
    raise exception 'WITHDRAWAL_PAID_NEEDS_PROOF: enter the transfer date and upload the proof';
  end if;
  if p_status = 'dibayar'
    and (coalesce(p_transfer_fee, 0) < 0 or coalesce(p_transfer_fee, 0) >= v_row.amount)
  then
    raise exception 'WITHDRAWAL_FEE_INVALID: the transfer fee must be below the amount';
  end if;
  if p_status = 'ditolak' and length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'WITHDRAWAL_REJECT_NEEDS_REASON: tell the kliper why';
  end if;

  perform set_config('app.withdrawal_write', 'on', true);
  update public.withdrawals
    set status = p_status,
        processed_by = (select auth.uid()),
        processed_at = now(),
        paid_at = case when p_status = 'dibayar' then p_paid_at else paid_at end,
        transfer_fee = case when p_status = 'dibayar' then coalesce(p_transfer_fee, 0) else transfer_fee end,
        transfer_proof_path = case when p_status = 'dibayar' then trim(p_proof_path) else transfer_proof_path end,
        rejection_reason = case when p_status = 'ditolak' then trim(p_reason) else rejection_reason end
    where id = p_id;
  perform set_config('app.withdrawal_write', 'off', true);

  if p_status = 'ditolak' then
    perform set_config('app.ledger_write', 'on', true);
    insert into public.creator_ledger_entries (creator_id, entry_type, amount, withdrawal_id, notes, created_by)
    values (v_row.creator_id, 'pengembalian_penarikan', v_row.amount, p_id, trim(p_reason), (select auth.uid()));
    perform set_config('app.ledger_write', 'off', true);
  end if;

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'withdrawal', p_id, 'withdrawal_' || p_status::text,
    jsonb_build_object(
      'creator_id', v_row.creator_id, 'amount', v_row.amount,
      'paid_at', p_paid_at, 'reason', nullif(trim(coalesce(p_reason, '')), ''),
      'transfer_fee', case when p_status = 'dibayar' then coalesce(p_transfer_fee, 0) end
    )
  );
end;
$$;


ALTER FUNCTION "public"."process_withdrawal"("p_id" "uuid", "p_status" "public"."withdrawal_status", "p_paid_at" "date", "p_proof_path" "text", "p_reason" "text", "p_transfer_fee" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_client_portal_link"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  -- Service role, seeds and migrations carry no JWT: let them through.
  if (select auth.uid()) is null or public.is_active_member() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
    or new.portal_invited_at is distinct from old.portal_invited_at then
    raise exception 'PORTAL_LINK_INTERNAL_ONLY: only the internal team can change portal access';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_client_portal_link"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_creator_portal_link"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  -- Service role, seeds and migrations carry no JWT: let them through.
  if (select auth.uid()) is null or public.is_active_member() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
    or new.portal_invited_at is distinct from old.portal_invited_at then
    raise exception 'PORTAL_LINK_INTERNAL_ONLY: only the internal team can change portal access';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_creator_portal_link"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_privileges"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  -- Service role and direct SQL (seeding, migrations) carry no JWT: let them through.
  if (select auth.uid()) is null or public.is_owner() then
    return new;
  end if;

  if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
    raise exception 'only an owner can change role or active status';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."protect_profile_privileges"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_clip_cancellation"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_notes" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."record_clip_cancellation"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_clip_credit"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_submission_id" "uuid", "p_verified_views" bigint, "p_credit" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
    raise exception 'CREDIT_ABOVE_CREATOR_CAP: the credit exceeds the per-kliper cap';
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


ALTER FUNCTION "public"."record_clip_credit"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_submission_id" "uuid", "p_verified_views" bigint, "p_credit" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_creator_account_deletion"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  me uuid := public.current_creator_id();
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no creator for this account';
  end if;
  update public.creators
  set deletion_requested_at = coalesce(deletion_requested_at, now())
  where id = me;
end;
$$;


ALTER FUNCTION "public"."request_creator_account_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_withdrawal"("p_amount" bigint) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  me uuid := public.current_creator_id();
  v_creator public.creators%rowtype;
  v_bank public.creator_bank_accounts%rowtype;
  v_balance bigint;
  v_id uuid;
begin
  if me is null then
    if public.current_creator_account_id() is not null then
      raise exception 'WITHDRAW_CREATOR_BLOCKED: a blocked kliper cannot withdraw';
    end if;
    raise exception 'CREATOR_NOT_FOUND: no active kliper for this account';
  end if;

  -- Serialises every withdrawal of this kliper (two requests at once).
  select * into v_creator from public.creators where id = me for update;
  if v_creator.status = 'diblokir' then
    raise exception 'WITHDRAW_CREATOR_BLOCKED: a blocked kliper cannot withdraw';
  end if;
  if v_creator.birth_date is null then
    raise exception 'WITHDRAW_NEEDS_BIRTH_DATE: fill in the birth date first';
  end if;

  select * into v_bank from public.creator_bank_accounts where creator_id = me;
  if v_bank.id is null then
    raise exception 'WITHDRAW_NEEDS_BANK: add a bank account first';
  end if;
  if v_bank.changed_at is not null and v_bank.changed_at > now() - interval '24 hours' then
    raise exception 'WITHDRAW_BANK_RECENT: the bank account changed less than 24 hours ago';
  end if;
  if exists (
    select 1 from public.withdrawals
    where creator_id = me and status in ('diajukan', 'diproses')
  ) then
    raise exception 'WITHDRAW_PENDING_EXISTS: a withdrawal is already in progress';
  end if;
  if p_amount is null or p_amount < public.current_min_withdrawal() then
    raise exception 'WITHDRAW_BELOW_MIN: the amount is below the minimum withdrawal';
  end if;

  v_balance := public.creator_balance(me);
  if p_amount > v_balance then
    raise exception 'WITHDRAW_ABOVE_BALANCE: the amount exceeds the available balance';
  end if;

  perform set_config('app.withdrawal_write', 'on', true);
  insert into public.withdrawals (creator_id, amount, bank_name, account_number, account_holder)
  values (me, p_amount, v_bank.bank_name, v_bank.account_number, v_bank.account_holder)
  returning id into v_id;
  perform set_config('app.withdrawal_write', 'off', true);

  perform set_config('app.ledger_write', 'on', true);
  insert into public.creator_ledger_entries (creator_id, entry_type, amount, withdrawal_id, created_by)
  values (me, 'penarikan', -p_amount, v_id, (select auth.uid()));
  perform set_config('app.ledger_write', 'off', true);

  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'withdrawal', v_id, 'withdrawal_request',
    jsonb_build_object('creator_id', me, 'amount', p_amount, 'balance_before', v_balance)
  );

  return v_id;
end;
$$;


ALTER FUNCTION "public"."request_withdrawal"("p_amount" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_metric_submission"("p_id" "uuid", "p_accept" boolean, "p_notes" "text" DEFAULT ''::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."review_metric_submission"("p_id" "uuid", "p_accept" boolean, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_creator_bank_account"("p_bank_name" "text", "p_account_number" "text", "p_account_holder" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  me uuid := public.current_creator_id();
  v_existing public.creator_bank_accounts%rowtype;
  v_saved public.creator_bank_accounts%rowtype;
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no active kliper for this account';
  end if;
  if length(trim(coalesce(p_bank_name, ''))) = 0 or length(trim(coalesce(p_account_holder, ''))) = 0 then
    raise exception 'BANK_ACCOUNT_INCOMPLETE: bank and holder name are required';
  end if;

  select * into v_existing from public.creator_bank_accounts where creator_id = me;

  insert into public.creator_bank_accounts (creator_id, bank_name, account_number, account_holder)
  values (me, trim(p_bank_name), regexp_replace(p_account_number, '[\s-]', '', 'g'), trim(p_account_holder))
  on conflict (creator_id) do update
    set bank_name = excluded.bank_name,
        account_number = excluded.account_number,
        account_holder = excluded.account_holder
  returning * into v_saved;

  -- FR-M11-01: the change is logged; never the number itself.
  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values (
    (select auth.uid()), 'creator_bank_account', me,
    case when v_existing.id is null then 'create' else 'update' end,
    jsonb_build_object(
      'bank_name', v_saved.bank_name,
      'last4', right(v_saved.account_number, 4),
      'holder_matches_name', v_saved.holder_matches_name,
      'from_portal', true
    )
  );
end;
$$;


ALTER FUNCTION "public"."save_creator_bank_account"("p_bank_name" "text", "p_account_number" "text", "p_account_holder" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_own_birth_date"("p_birth_date" "date") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  me uuid := public.current_creator_id();
  v_creator public.creators%rowtype;
begin
  if me is null then
    raise exception 'CREATOR_NOT_FOUND: no active kliper for this account';
  end if;

  select * into v_creator from public.creators where id = me for update;
  if v_creator.birth_date is not null then
    raise exception 'BIRTH_DATE_ALREADY_SET: ask the team to change the birth date';
  end if;
  if p_birth_date is null
    or p_birth_date < date '1900-01-01'
    or p_birth_date > current_date
  then
    raise exception 'BIRTH_DATE_INVALID: the birth date is not a valid past date';
  end if;

  update public.creators set birth_date = p_birth_date where id = me;

  -- The date itself stays out of the log (UU PDP).
  insert into public.activity_logs (actor_id, entity_type, entity_id, action, details)
  values ((select auth.uid()), 'creator', me, 'birth_date_set', jsonb_build_object('from_portal', true));
end;
$$;


ALTER FUNCTION "public"."set_own_birth_date"("p_birth_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_clip"("p_assignment_id" "uuid", "p_platform" "public"."social_platform", "p_posted_url" "text", "p_posted_at" timestamp with time zone, "p_views" bigint, "p_likes" bigint, "p_comments" bigint, "p_shares" bigint, "p_proof_path" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."submit_clip"("p_assignment_id" "uuid", "p_platform" "public"."social_platform", "p_posted_url" "text", "p_posted_at" timestamp with time zone, "p_views" bigint, "p_likes" bigint, "p_comments" bigint, "p_shares" bigint, "p_proof_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_bank_account_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  new.holder_matches_name := public.normalize_person_name(new.account_holder) = (
    select public.normalize_person_name(c.full_name) from public.creators c where c.id = new.creator_id
  );

  -- Service role and seeds (no JWT) may set the stamp themselves.
  if (select auth.uid()) is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.changed_at := null;
  elsif new.bank_name is distinct from old.bank_name
    or new.account_number is distinct from old.account_number
    or new.account_holder is distinct from old.account_holder
  then
    new.changed_at := now();
  else
    new.changed_at := old.changed_at;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."track_bank_account_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_clip"("p_content_id" "uuid", "p_decision" "public"."review_decision", "p_checklist" "jsonb", "p_notes" "text", "p_rejection_reason" "public"."clip_rejection_reason", "p_verified_views" bigint, "p_credit" bigint, "p_credit_limited" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
      raise exception 'CLIP_REJECT_NEEDS_NOTES: tell the kliper why the clip was rejected';
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


ALTER FUNCTION "public"."verify_clip"("p_content_id" "uuid", "p_decision" "public"."review_decision", "p_checklist" "jsonb", "p_notes" "text", "p_rejection_reason" "public"."clip_rejection_reason", "p_verified_views" bigint, "p_credit" bigint, "p_credit_limited" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_views_update"("p_submission_id" "uuid", "p_accept" boolean, "p_verified_views" bigint, "p_notes" "text", "p_credit" bigint, "p_credit_limited" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
      raise exception 'SUBMISSION_REJECT_NEEDS_NOTES: tell the kliper why it was rejected';
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


ALTER FUNCTION "public"."verify_views_update"("p_submission_id" "uuid", "p_accept" boolean, "p_verified_views" bigint, "p_notes" "text", "p_credit" bigint, "p_credit_limited" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."withdraw_pending_clips"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_content_id uuid;
  v_note constant text := 'Kliper mundur dari kampanye.';
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


ALTER FUNCTION "public"."withdraw_pending_clips"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "type" "public"."asset_type" NOT NULL,
    "file_path" "text",
    "external_url" "text",
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaign_assets_source_check" CHECK (("num_nonnulls"("file_path", "external_url") = 1)),
    CONSTRAINT "campaign_assets_title_check" CHECK (("length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "campaign_assets_url_check" CHECK ((("external_url" IS NULL) OR ("external_url" ~ '^https?://'::"text")))
);


ALTER TABLE "public"."campaign_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_creators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "status" "public"."assignment_status" DEFAULT 'diundang'::"public"."assignment_status" NOT NULL,
    "contents_committed" integer DEFAULT 1 NOT NULL,
    "base_fee" bigint,
    "bonus_per_1000_views" bigint,
    "bonus_per_registrant" bigint,
    "views_bonus_cap" bigint,
    "referral_code" "text" DEFAULT "public"."generate_referral_code"() NOT NULL,
    "tracking_slug" "text" DEFAULT "public"."generate_tracking_slug"(NULL::"text") NOT NULL,
    "joined_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "creator_confirmed_at" timestamp with time zone,
    "join_source" "public"."assignment_join_source" DEFAULT 'tim'::"public"."assignment_join_source" NOT NULL,
    "withdrawn_at" timestamp with time zone,
    CONSTRAINT "campaign_creators_contents_check" CHECK (("contents_committed" >= 0)),
    CONSTRAINT "campaign_creators_money_check" CHECK (((("base_fee" IS NULL) OR ("base_fee" >= 0)) AND (("bonus_per_1000_views" IS NULL) OR ("bonus_per_1000_views" >= 0)) AND (("bonus_per_registrant" IS NULL) OR ("bonus_per_registrant" >= 0)) AND (("views_bonus_cap" IS NULL) OR ("views_bonus_cap" >= 0)))),
    CONSTRAINT "campaign_creators_referral_code_format" CHECK (("referral_code" ~ '^[A-HJ-NP-Z2-9]{6,8}$'::"text")),
    CONSTRAINT "campaign_creators_tracking_slug_format" CHECK (("tracking_slug" ~ '^[a-z0-9]([a-z0-9-]{2,38}[a-z0-9])$'::"text"))
);


ALTER TABLE "public"."campaign_creators" OWNER TO "postgres";


COMMENT ON COLUMN "public"."campaign_creators"."creator_confirmed_at" IS 'When the creator confirmed the brief from the portal (FR-M13-10). Distinct from joined_at, which the team may also set by hand.';



COMMENT ON COLUMN "public"."campaign_creators"."join_source" IS 'mandiri = the kliper joined from the catalog (FR-M17-04); tim = added by the team.';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "objective" "public"."campaign_objective",
    "brief" "text" DEFAULT ''::"text" NOT NULL,
    "must_do" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "must_not" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "hashtags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "paid_label_required" boolean DEFAULT true NOT NULL,
    "landing_url" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "min_live_days" integer DEFAULT 30 NOT NULL,
    "status" "public"."campaign_status" DEFAULT 'draft'::"public"."campaign_status" NOT NULL,
    "package_price" bigint DEFAULT 0 NOT NULL,
    "target_contents" integer DEFAULT 0 NOT NULL,
    "target_views" bigint DEFAULT 0 NOT NULL,
    "target_registrants" integer DEFAULT 0 NOT NULL,
    "default_base_fee" bigint DEFAULT 0 NOT NULL,
    "default_bonus_per_1000_views" bigint DEFAULT 0 NOT NULL,
    "default_bonus_per_registrant" bigint DEFAULT 0 NOT NULL,
    "default_views_bonus_cap" bigint,
    "closing_notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "access" "public"."campaign_access" DEFAULT 'terbuka'::"public"."campaign_access" NOT NULL,
    "payout_model" "public"."payout_model" DEFAULT 'per_views'::"public"."payout_model" NOT NULL,
    "rate_per_1000_views" bigint DEFAULT 0 NOT NULL,
    "creator_budget" bigint DEFAULT 0 NOT NULL,
    "max_payout_per_clip" bigint,
    "max_payout_per_creator" bigint,
    "min_views_to_earn" bigint DEFAULT 0 NOT NULL,
    "max_clips_per_creator" integer DEFAULT 3 NOT NULL,
    "allowed_platforms" "public"."social_platform"[] DEFAULT '{}'::"public"."social_platform"[] NOT NULL,
    "local_only" boolean DEFAULT false NOT NULL,
    "claim_grace_days" integer DEFAULT 3 NOT NULL,
    "published_at" timestamp with time zone,
    CONSTRAINT "campaigns_claim_grace_days_check" CHECK ((("claim_grace_days" >= 0) AND ("claim_grace_days" <= 60))),
    CONSTRAINT "campaigns_code_format" CHECK ((("code" ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'::"text") AND ("length"("code") <= 50))),
    CONSTRAINT "campaigns_landing_url_check" CHECK ((("landing_url" IS NULL) OR ("landing_url" ~ '^https?://'::"text"))),
    CONSTRAINT "campaigns_max_clips_check" CHECK ((("max_clips_per_creator" >= 1) AND ("max_clips_per_creator" <= 50))),
    CONSTRAINT "campaigns_min_live_days_check" CHECK (("min_live_days" >= 0)),
    CONSTRAINT "campaigns_money_check" CHECK ((("package_price" >= 0) AND ("default_base_fee" >= 0) AND ("default_bonus_per_1000_views" >= 0) AND ("default_bonus_per_registrant" >= 0) AND (("default_views_bonus_cap" IS NULL) OR ("default_views_bonus_cap" >= 0)))),
    CONSTRAINT "campaigns_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "campaigns_paket_invite_only" CHECK ((("payout_model" = 'per_views'::"public"."payout_model") OR ("access" = 'undangan'::"public"."campaign_access"))),
    CONSTRAINT "campaigns_per_views_money_check" CHECK ((("rate_per_1000_views" >= 0) AND ("creator_budget" >= 0) AND (("max_payout_per_clip" IS NULL) OR ("max_payout_per_clip" > 0)) AND (("max_payout_per_creator" IS NULL) OR ("max_payout_per_creator" > 0)) AND ("min_views_to_earn" >= 0))),
    CONSTRAINT "campaigns_period_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "campaigns_targets_check" CHECK ((("target_contents" >= 0) AND ("target_views" >= 0) AND ("target_registrants" >= 0)))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


COMMENT ON COLUMN "public"."campaigns"."objective" IS 'FR-M4-01: legacy paket campaigns only (pendaftar/awareness/event). Always null for per_views.';



COMMENT ON COLUMN "public"."campaigns"."access" IS 'FR-M17-01: terbuka = listed in the portal catalog, klipers join themselves; undangan = team-assigned only.';



COMMENT ON COLUMN "public"."campaigns"."payout_model" IS 'FR-M17-01: per_views (v4.0) or paket (campaigns created before v4.0). Fixed once the campaign leaves draft.';



COMMENT ON COLUMN "public"."campaigns"."creator_budget" IS 'FR-M17-01: honor budget for klipers in whole Rupiah. Never shown to klipers as an amount.';



CREATE TABLE IF NOT EXISTS "public"."client_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "position" "text" DEFAULT ''::"text" NOT NULL,
    "phone_wa" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "portal_invited_at" timestamp with time zone,
    CONSTRAINT "client_contacts_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."client_contacts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."client_contacts"."profile_id" IS 'Portal account (profiles.role = client), set when the invitation is sent (FR-M14-01). One account per person, so an approval always names who gave it.';



COMMENT ON COLUMN "public"."client_contacts"."portal_invited_at" IS 'When the latest portal invitation was sent.';



CREATE TABLE IF NOT EXISTS "public"."client_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "invoice_number" "text" NOT NULL,
    "amount" bigint NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "public"."client_payment_status" DEFAULT 'belum_dibayar'::"public"."client_payment_status" NOT NULL,
    "paid_amount" bigint DEFAULT 0 NOT NULL,
    "paid_at" "date",
    "proof_path" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "client_payments_amount_check" CHECK ((("amount" > 0) AND ("paid_amount" >= 0))),
    CONSTRAINT "client_payments_invoice_check" CHECK (("length"(TRIM(BOTH FROM "invoice_number")) > 0)),
    CONSTRAINT "client_payments_paid_at_check" CHECK ((("paid_amount" = 0) OR ("paid_at" IS NOT NULL)))
);


ALTER TABLE "public"."client_payments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."client_portal_campaigns" WITH ("security_invoker"='off') AS
 SELECT "id",
    "code",
    "name",
    "objective",
    "status",
    "brief",
    "start_date",
    "end_date",
    "min_live_days",
    "target_contents",
    "target_views",
    "target_registrants",
    "created_at"
   FROM "public"."campaigns" "c"
  WHERE (("client_id" = "public"."current_client_id"()) AND ("status" = ANY (ARRAY['aktif'::"public"."campaign_status", 'selesai'::"public"."campaign_status"])));


ALTER VIEW "public"."client_portal_campaigns" OWNER TO "postgres";


COMMENT ON VIEW "public"."client_portal_campaigns" IS 'FR-M14-03: the client''s own campaigns. Never exposes package_price, the fee scheme or margin.';



CREATE TABLE IF NOT EXISTS "public"."contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_creator_id" "uuid" NOT NULL,
    "platform" "public"."social_platform" NOT NULL,
    "draft_url" "text",
    "draft_file_path" "text",
    "caption_draft" "text" DEFAULT ''::"text" NOT NULL,
    "review_status" "public"."review_status" DEFAULT 'menunggu_review'::"public"."review_status" NOT NULL,
    "revision_count" integer DEFAULT 0 NOT NULL,
    "posted_url" "text",
    "posted_at" timestamp with time zone,
    "live_status" "public"."live_status" DEFAULT 'belum_tayang'::"public"."live_status" NOT NULL,
    "removed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "proposed_posted_url" "text",
    "proposed_posted_at" timestamp with time zone,
    "proposed_at" timestamp with time zone,
    "posted_url_normalized" "text",
    "verified_views" bigint,
    "rejection_reason" "public"."clip_rejection_reason",
    "caption_code_checked" boolean DEFAULT false NOT NULL,
    CONSTRAINT "contents_draft_source_check" CHECK (("num_nonnulls"("draft_url", "draft_file_path", "proposed_posted_url", "posted_url") >= 1)),
    CONSTRAINT "contents_draft_url_check" CHECK ((("draft_url" IS NULL) OR ("draft_url" ~ '^https?://'::"text"))),
    CONSTRAINT "contents_live_status_check" CHECK ((("live_status" = 'belum_tayang'::"public"."live_status") = ("posted_url" IS NULL))),
    CONSTRAINT "contents_posted_pair_check" CHECK ((("posted_url" IS NULL) = ("posted_at" IS NULL))),
    CONSTRAINT "contents_posted_requires_approval" CHECK ((("posted_url" IS NULL) OR ("review_status" = 'disetujui'::"public"."review_status"))),
    CONSTRAINT "contents_posted_url_check" CHECK ((("posted_url" IS NULL) OR ("posted_url" ~ '^https?://'::"text"))),
    CONSTRAINT "contents_proposed_pair_check" CHECK (("num_nonnulls"("proposed_posted_url", "proposed_posted_at", "proposed_at") = ANY (ARRAY[0, 3]))),
    CONSTRAINT "contents_proposed_url_check" CHECK ((("proposed_posted_url" IS NULL) OR ("proposed_posted_url" ~ '^https?://'::"text"))),
    CONSTRAINT "contents_rejection_reason_check" CHECK ((("rejection_reason" IS NULL) OR ("review_status" = 'ditolak'::"public"."review_status"))),
    CONSTRAINT "contents_removed_check" CHECK (((("live_status" = 'dihapus'::"public"."live_status") = ("removed_at" IS NOT NULL)) AND (("removed_at" IS NULL) OR ("removed_at" >= "posted_at")))),
    CONSTRAINT "contents_revision_count_check" CHECK (("revision_count" >= 0)),
    CONSTRAINT "contents_verified_views_check" CHECK ((("verified_views" IS NULL) OR ("verified_views" >= 0)))
);


ALTER TABLE "public"."contents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contents"."proposed_posted_url" IS 'Live URL reported by the creator from the portal; only the team turns it into posted_url (FR-M13-09).';



COMMENT ON COLUMN "public"."contents"."posted_url_normalized" IS 'FR-M18-02: clip URL normalised by normalize_clip_url(); unique across all clips that were not rejected.';



COMMENT ON COLUMN "public"."contents"."verified_views" IS 'FR-M18-04: views the team verified on the latest accepted submission of a per_views clip.';



CREATE TABLE IF NOT EXISTS "public"."creators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "stage_name" "text" DEFAULT ''::"text" NOT NULL,
    "phone_wa" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "province" "text" DEFAULT ''::"text" NOT NULL,
    "birth_date" "date",
    "niches" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "tier" "public"."creator_tier" DEFAULT 'nano'::"public"."creator_tier" NOT NULL,
    "status" "public"."creator_status" DEFAULT 'prospek'::"public"."creator_status" NOT NULL,
    "terms_version" "text",
    "terms_agreed_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "anonymized_at" timestamp with time zone,
    "profile_id" "uuid",
    "portal_invited_at" timestamp with time zone,
    "signup_source" "public"."signup_source" DEFAULT 'undangan'::"public"."signup_source" NOT NULL,
    "verification_code" "text" DEFAULT "public"."generate_verification_code"() NOT NULL,
    "blocked_at" timestamp with time zone,
    "blocked_reason" "text",
    "deletion_requested_at" timestamp with time zone,
    CONSTRAINT "creators_birth_date_range_check" CHECK ((("birth_date" IS NULL) OR (("birth_date" >= '1900-01-01'::"date") AND ("birth_date" <= CURRENT_DATE)))),
    CONSTRAINT "creators_blocked_reason_check" CHECK ((("status" <> 'diblokir'::"public"."creator_status") OR ("length"(TRIM(BOTH FROM COALESCE("blocked_reason", ''::"text"))) > 0))),
    CONSTRAINT "creators_full_name_check" CHECK (("length"(TRIM(BOTH FROM "full_name")) > 0)),
    CONSTRAINT "creators_terms_pair_check" CHECK ((("terms_version" IS NULL) = ("terms_agreed_at" IS NULL))),
    CONSTRAINT "creators_verification_code_check" CHECK (("verification_code" ~ '^KB-[A-HJ-NP-Z2-9]{6}$'::"text"))
);


ALTER TABLE "public"."creators" OWNER TO "postgres";


COMMENT ON COLUMN "public"."creators"."profile_id" IS 'Portal account (profiles.role = creator), set when the invitation is sent (FR-M13-01).';



COMMENT ON COLUMN "public"."creators"."portal_invited_at" IS 'When the latest portal invitation was sent.';



CREATE OR REPLACE VIEW "public"."client_portal_contents" WITH ("security_invoker"='off') AS
 SELECT "ct"."id",
    "cc"."campaign_id",
    "cc"."id" AS "campaign_creator_id",
    "ct"."platform",
    "ct"."posted_url",
    "ct"."posted_at",
    "ct"."live_status",
    "ct"."removed_at",
    NULLIF("cr"."stage_name", ''::"text") AS "creator_name"
   FROM (("public"."contents" "ct"
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "ct"."campaign_creator_id")))
     JOIN "public"."creators" "cr" ON (("cr"."id" = "cc"."creator_id")))
  WHERE ("public"."client_owns_campaign"("cc"."campaign_id") AND ("ct"."posted_at" IS NOT NULL) AND ("ct"."live_status" <> 'belum_tayang'::"public"."live_status"));


ALTER VIEW "public"."client_portal_contents" OWNER TO "postgres";


COMMENT ON VIEW "public"."client_portal_contents" IS 'FR-M14-03: content that actually went live, by stage name.';



CREATE TABLE IF NOT EXISTS "public"."link_clicks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_creator_id" "uuid" NOT NULL,
    "clicked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "referrer" "text",
    "user_agent" "text",
    "ip_hash" "text",
    "is_bot" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."link_clicks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrant_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "campaign_creator_id" "uuid",
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "registrant_count" integer NOT NULL,
    "proof_path" "text",
    "proof_confirmed_no_personal_data" boolean DEFAULT false NOT NULL,
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "entered_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registrant_reports_count_check" CHECK (("registrant_count" >= 0)),
    CONSTRAINT "registrant_reports_period_check" CHECK (("period_end" >= "period_start")),
    CONSTRAINT "registrant_reports_proof_confirmation_check" CHECK ((("proof_path" IS NULL) OR "proof_confirmed_no_personal_data"))
);


ALTER TABLE "public"."registrant_reports" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."client_portal_creators" WITH ("security_invoker"='off') AS
 SELECT "cc"."id" AS "campaign_creator_id",
    "cc"."campaign_id",
    NULLIF("cr"."stage_name", ''::"text") AS "creator_name",
    "cc"."referral_code",
    ( SELECT "count"(*) AS "count"
           FROM "public"."contents" "ct"
          WHERE (("ct"."campaign_creator_id" = "cc"."id") AND ("ct"."posted_at" IS NOT NULL))) AS "live_contents",
    ( SELECT "count"(*) AS "count"
           FROM "public"."link_clicks" "lc"
          WHERE ("lc"."campaign_creator_id" = "cc"."id")) AS "clicks_total",
    ( SELECT "count"(*) AS "count"
           FROM "public"."link_clicks" "lc"
          WHERE (("lc"."campaign_creator_id" = "cc"."id") AND (NOT "lc"."is_bot"))) AS "clicks_human",
    ( SELECT COALESCE("sum"("rr"."registrant_count"), (0)::bigint) AS "coalesce"
           FROM "public"."registrant_reports" "rr"
          WHERE ("rr"."campaign_creator_id" = "cc"."id")) AS "registrants"
   FROM ("public"."campaign_creators" "cc"
     JOIN "public"."creators" "cr" ON (("cr"."id" = "cc"."creator_id")))
  WHERE "public"."client_owns_campaign"("cc"."campaign_id");


ALTER VIEW "public"."client_portal_creators" OWNER TO "postgres";


COMMENT ON VIEW "public"."client_portal_creators" IS 'FR-M14-03: per-creator recap for the client, with the referral code they will report against.';



CREATE TABLE IF NOT EXISTS "public"."metric_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "checkpoint" "public"."metric_checkpoint" NOT NULL,
    "captured_at" timestamp with time zone NOT NULL,
    "views" bigint DEFAULT 0 NOT NULL,
    "likes" bigint DEFAULT 0 NOT NULL,
    "comments" bigint DEFAULT 0 NOT NULL,
    "shares" bigint DEFAULT 0 NOT NULL,
    "saves" bigint DEFAULT 0 NOT NULL,
    "proof_path" "text" NOT NULL,
    "entered_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "metric_snapshots_counts_check" CHECK ((("views" >= 0) AND ("likes" >= 0) AND ("comments" >= 0) AND ("shares" >= 0) AND ("saves" >= 0))),
    CONSTRAINT "metric_snapshots_proof_check" CHECK (("length"(TRIM(BOTH FROM "proof_path")) > 0))
);


ALTER TABLE "public"."metric_snapshots" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."client_portal_metrics" WITH ("security_invoker"='off') AS
 SELECT "s"."id",
    "s"."content_id",
    "cc"."campaign_id",
    "s"."checkpoint",
    "s"."captured_at",
    "s"."views",
    "s"."likes",
    "s"."comments",
    "s"."shares",
    "s"."saves"
   FROM (("public"."metric_snapshots" "s"
     JOIN "public"."contents" "ct" ON (("ct"."id" = "s"."content_id")))
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "ct"."campaign_creator_id")))
  WHERE "public"."client_owns_campaign"("cc"."campaign_id");


ALTER VIEW "public"."client_portal_metrics" OWNER TO "postgres";


COMMENT ON VIEW "public"."client_portal_metrics" IS 'FR-M14-03: verified snapshots behind the client''s charts and totals.';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."client_type" DEFAULT 'lainnya'::"public"."client_type" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "province" "text" DEFAULT ''::"text" NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clients_name_check" CHECK (("length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "decision" "public"."review_decision" NOT NULL,
    "checklist" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "draft_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "reviewer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_reviews_revision_notes_check" CHECK ((("decision" <> 'revisi'::"public"."review_decision") OR ("length"(TRIM(BOTH FROM "notes")) > 0)))
);


ALTER TABLE "public"."content_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."creator_bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "bank_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_at" timestamp with time zone,
    "holder_matches_name" boolean DEFAULT true NOT NULL,
    CONSTRAINT "creator_bank_accounts_number_check" CHECK (("account_number" ~ '^[0-9]{4,}$'::"text"))
);


ALTER TABLE "public"."creator_bank_accounts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."creator_bank_accounts"."changed_at" IS 'Last change of bank, number or holder after the first save; withdrawals wait 24 hours after it (FR-M19-04).';



CREATE TABLE IF NOT EXISTS "public"."creator_ledger_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "entry_type" "public"."ledger_entry_type" NOT NULL,
    "amount" bigint NOT NULL,
    "campaign_id" "uuid",
    "content_id" "uuid",
    "metric_submission_id" "uuid",
    "withdrawal_id" "uuid",
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_ledger_entries_adjustment_notes_check" CHECK ((("entry_type" <> 'penyesuaian'::"public"."ledger_entry_type") OR ("length"(TRIM(BOTH FROM "notes")) > 0))),
    CONSTRAINT "creator_ledger_entries_amount_sign_check" CHECK (
CASE "entry_type"
    WHEN 'honor_klip'::"public"."ledger_entry_type" THEN ("amount" > 0)
    WHEN 'pengembalian_penarikan'::"public"."ledger_entry_type" THEN ("amount" > 0)
    WHEN 'pembatalan'::"public"."ledger_entry_type" THEN ("amount" < 0)
    WHEN 'penarikan'::"public"."ledger_entry_type" THEN ("amount" < 0)
    ELSE ("amount" <> 0)
END),
    CONSTRAINT "creator_ledger_entries_clip_ref_check" CHECK ((("entry_type" <> ALL (ARRAY['honor_klip'::"public"."ledger_entry_type", 'pembatalan'::"public"."ledger_entry_type"])) OR (("campaign_id" IS NOT NULL) AND ("content_id" IS NOT NULL)))),
    CONSTRAINT "creator_ledger_entries_withdrawal_ref_check" CHECK ((("entry_type" <> ALL (ARRAY['penarikan'::"public"."ledger_entry_type", 'pengembalian_penarikan'::"public"."ledger_entry_type"])) OR ("withdrawal_id" IS NOT NULL)))
);


ALTER TABLE "public"."creator_ledger_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."creator_ledger_entries" IS 'FR-M19-01: kliper balance ledger. Balance = sum(amount). Append-only; entries only come from security definer functions.';



CREATE OR REPLACE VIEW "public"."creator_portal_account" WITH ("security_invoker"='off') AS
 SELECT "id",
    "full_name",
    "stage_name",
    "status",
    "blocked_at",
    "blocked_reason"
   FROM "public"."creators" "c"
  WHERE ("id" = "public"."current_creator_account_id"());


ALTER VIEW "public"."creator_portal_account" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_account" IS 'FR-M3-09: who the signed-in kliper is, including a blocked one, and why they were blocked.';



CREATE OR REPLACE VIEW "public"."creator_portal_assets" WITH ("security_invoker"='off') AS
 SELECT "id",
    "campaign_id",
    "title",
    "type",
    "file_path",
    "external_url",
    "notes",
    "created_at"
   FROM "public"."campaign_assets" "a"
  WHERE "public"."creator_can_view_campaign_assets"("campaign_id");


ALTER VIEW "public"."creator_portal_assets" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_assets" IS 'FR-M13-04, PRD 7.4: material of the campaigns this kliper is on, and of open catalog campaigns once their account is active.';



CREATE OR REPLACE VIEW "public"."creator_portal_assignments" WITH ("security_invoker"='off') AS
 SELECT "cc"."id",
    "cc"."campaign_id",
    "cc"."status",
    "cc"."contents_committed",
    "cc"."referral_code",
    "cc"."tracking_slug",
    "cc"."joined_at",
    COALESCE("cc"."base_fee", "cp"."default_base_fee") AS "base_fee",
    COALESCE("cc"."bonus_per_1000_views", "cp"."default_bonus_per_1000_views") AS "bonus_per_1000_views",
    COALESCE("cc"."bonus_per_registrant", "cp"."default_bonus_per_registrant") AS "bonus_per_registrant",
    COALESCE("cc"."views_bonus_cap", "cp"."default_views_bonus_cap") AS "views_bonus_cap",
    "cp"."code" AS "campaign_code",
    "cp"."name" AS "campaign_name",
    "cp"."objective" AS "campaign_objective",
    "cp"."status" AS "campaign_status",
    "cp"."brief",
    "cp"."must_do",
    "cp"."must_not",
    "cp"."hashtags",
    "cp"."paid_label_required",
    "cp"."landing_url",
    "cp"."start_date",
    "cp"."end_date",
    "cp"."min_live_days",
    "cl"."name" AS "client_name",
    "cc"."creator_confirmed_at",
    "cp"."payout_model",
    "cp"."access",
    "cp"."rate_per_1000_views",
    "cp"."max_payout_per_clip",
    "cp"."max_payout_per_creator",
    "cp"."min_views_to_earn",
    "cp"."max_clips_per_creator",
    "cp"."allowed_platforms",
    "cp"."local_only",
    "cp"."claim_grace_days",
    "cc"."join_source",
    "cc"."withdrawn_at"
   FROM (("public"."campaign_creators" "cc"
     JOIN "public"."campaigns" "cp" ON (("cp"."id" = "cc"."campaign_id")))
     JOIN "public"."clients" "cl" ON (("cl"."id" = "cp"."client_id")))
  WHERE (("cc"."creator_id" = "public"."current_creator_id"()) AND ("cp"."status" = ANY (ARRAY['aktif'::"public"."campaign_status", 'selesai'::"public"."campaign_status"])));


ALTER VIEW "public"."creator_portal_assignments" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_assignments" IS 'FR-M13-03, FR-M13-04, FR-M13-10: the creator own assignments, briefs and confirmation. Never exposes package_price, targets or margin.';



CREATE OR REPLACE VIEW "public"."creator_portal_balance" WITH ("security_invoker"='off') AS
 SELECT "me"."id" AS "creator_id",
    (COALESCE("sum"("e"."amount"), (0)::numeric))::bigint AS "available",
    (COALESCE("sum"("e"."amount") FILTER (WHERE ("e"."entry_type" = ANY (ARRAY['honor_klip'::"public"."ledger_entry_type", 'pembatalan'::"public"."ledger_entry_type", 'penyesuaian'::"public"."ledger_entry_type"]))), (0)::numeric))::bigint AS "total_earned",
    (COALESCE((- "sum"("e"."amount") FILTER (WHERE ("e"."entry_type" = ANY (ARRAY['penarikan'::"public"."ledger_entry_type", 'pengembalian_penarikan'::"public"."ledger_entry_type"])))), (0)::numeric))::bigint AS "total_withdrawn",
    "public"."current_min_withdrawal"() AS "min_withdrawal"
   FROM (( SELECT "public"."current_creator_account_id"() AS "id") "me"
     LEFT JOIN "public"."creator_ledger_entries" "e" ON (("e"."creator_id" = "me"."id")))
  WHERE ("me"."id" IS NOT NULL)
  GROUP BY "me"."id";


ALTER VIEW "public"."creator_portal_balance" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_balance" IS 'FR-M19-03: available balance, total earned, total withdrawn (incl. in progress) and the current minimum withdrawal.';



CREATE OR REPLACE VIEW "public"."creator_portal_bank_account" WITH ("security_invoker"='off') AS
 SELECT "bank_name",
    ("repeat"('*'::"text", GREATEST(("length"("account_number") - 4), 0)) || "right"("account_number", 4)) AS "account_number_masked",
    "account_holder",
    "holder_matches_name",
    "changed_at",
        CASE
            WHEN ("changed_at" IS NULL) THEN NULL::timestamp with time zone
            ELSE ("changed_at" + '24:00:00'::interval)
        END AS "hold_until",
    "updated_at"
   FROM "public"."creator_bank_accounts" "b"
  WHERE ("creator_id" = "public"."current_creator_account_id"());


ALTER VIEW "public"."creator_portal_bank_account" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_bank_account" IS 'FR-M19-04: the kliper''s own bank account, number masked.';



CREATE OR REPLACE VIEW "public"."creator_portal_catalog" WITH ("security_invoker"='off') AS
 SELECT "c"."id",
    "c"."code",
    "c"."name",
    "cl"."name" AS "client_name",
    "c"."objective",
    "c"."brief",
    "c"."must_do",
    "c"."must_not",
    "c"."hashtags",
    "c"."paid_label_required",
    "c"."allowed_platforms",
    "c"."rate_per_1000_views",
    "c"."max_payout_per_clip",
    "c"."max_payout_per_creator",
    "c"."min_views_to_earn",
    "c"."max_clips_per_creator",
    "c"."local_only",
    "c"."start_date",
    "c"."end_date",
    "c"."min_live_days",
    "c"."claim_grace_days",
    "c"."published_at",
        CASE
            WHEN ("c"."creator_budget" > 0) THEN (LEAST((100)::bigint, ((GREATEST((0)::bigint, ("c"."creator_budget" - "spent"."cost")) * 100) / "c"."creator_budget")))::integer
            ELSE 0
        END AS "budget_remaining_pct",
    "public"."campaign_budget_exhausted"("c"."id") AS "budget_exhausted",
    (( SELECT "count"(*) AS "count"
           FROM "public"."campaign_assets" "a"
          WHERE ("a"."campaign_id" = "c"."id")))::integer AS "asset_count",
    "cc"."id" AS "assignment_id",
    "cc"."status" AS "assignment_status",
    "c"."creator_budget" AS "budget_total",
    GREATEST("spent"."cost", (0)::bigint) AS "budget_used",
    GREATEST(("c"."creator_budget" - "spent"."cost"), (0)::bigint) AS "budget_remaining"
   FROM ((("public"."campaigns" "c"
     JOIN "public"."clients" "cl" ON (("cl"."id" = "c"."client_id")))
     CROSS JOIN LATERAL ( SELECT "public"."campaign_creator_cost"("c"."id") AS "cost") "spent")
     LEFT JOIN "public"."campaign_creators" "cc" ON ((("cc"."campaign_id" = "c"."id") AND ("cc"."creator_id" = "public"."current_creator_id"()))))
  WHERE (("c"."status" = 'aktif'::"public"."campaign_status") AND ("c"."access" = 'terbuka'::"public"."campaign_access") AND ("c"."payout_model" = 'per_views'::"public"."payout_model") AND ("c"."end_date" >= "public"."campaign_today"()) AND (EXISTS ( SELECT 1
           FROM "public"."creators" "me"
          WHERE (("me"."id" = "public"."current_creator_id"()) AND ("me"."status" = ANY (ARRAY['aktif'::"public"."creator_status", 'terverifikasi'::"public"."creator_status", 'prospek'::"public"."creator_status"]))))));


ALTER VIEW "public"."creator_portal_catalog" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_catalog" IS 'FR-M17-03: open per_views campaigns for the signed-in kliper, with the kliper budget (total, spent, left). No package_price, targets or internal notes.';



CREATE OR REPLACE VIEW "public"."creator_portal_contents" WITH ("security_invoker"='off') AS
 SELECT "c"."id",
    "c"."campaign_creator_id",
    "cc"."campaign_id",
    "c"."platform",
    "c"."draft_url",
    "c"."draft_file_path",
    "c"."caption_draft",
    "c"."review_status",
    "c"."revision_count",
    "c"."posted_url",
    "c"."posted_at",
    "c"."live_status",
    "c"."removed_at",
    "c"."proposed_posted_url",
    "c"."proposed_posted_at",
    "c"."proposed_at",
    "c"."created_at",
    "c"."updated_at",
    "c"."verified_views",
    "c"."rejection_reason",
    "public"."clip_credited_amount"("c"."id") AS "earned_amount"
   FROM ("public"."contents" "c"
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "c"."campaign_creator_id")))
  WHERE ("cc"."creator_id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_contents" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_contents" IS 'FR-M13-05, FR-M18: the kliper''s own content and clips, with review status, verified views and the honor credited per clip.';



CREATE OR REPLACE VIEW "public"."creator_portal_ledger" WITH ("security_invoker"='off') AS
 SELECT "e"."id",
    "e"."entry_type",
    "e"."amount",
    "e"."campaign_id",
    "cp"."name" AS "campaign_name",
    "e"."content_id",
    "e"."withdrawal_id",
    "e"."notes",
    "e"."created_at"
   FROM ("public"."creator_ledger_entries" "e"
     LEFT JOIN "public"."campaigns" "cp" ON (("cp"."id" = "e"."campaign_id")))
  WHERE ("e"."creator_id" = "public"."current_creator_account_id"());


ALTER VIEW "public"."creator_portal_ledger" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_ledger" IS 'FR-M19-03: the kliper''s own ledger entries.';



CREATE OR REPLACE VIEW "public"."creator_portal_metrics" WITH ("security_invoker"='off') AS
 SELECT "s"."id",
    "s"."content_id",
    "s"."checkpoint",
    "s"."captured_at",
    "s"."views",
    "s"."likes",
    "s"."comments",
    "s"."shares",
    "s"."saves",
    "s"."created_at"
   FROM (("public"."metric_snapshots" "s"
     JOIN "public"."contents" "c" ON (("c"."id" = "s"."content_id")))
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "c"."campaign_creator_id")))
  WHERE ("cc"."creator_id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_metrics" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_metrics" IS 'FR-M13-06: official snapshots on the creator''s own content.';



CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_creator_id" "uuid" NOT NULL,
    "base_amount" bigint DEFAULT 0 NOT NULL,
    "views_bonus" bigint DEFAULT 0 NOT NULL,
    "registrant_bonus" bigint DEFAULT 0 NOT NULL,
    "adjustment_amount" bigint DEFAULT 0 NOT NULL,
    "adjustment_reason" "text" DEFAULT ''::"text" NOT NULL,
    "total_amount" bigint DEFAULT 0 NOT NULL,
    "calculation_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "public"."payout_status" DEFAULT 'draf'::"public"."payout_status" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "paid_at" "date",
    "transfer_proof_path" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payouts_adjustment_reason_check" CHECK ((("adjustment_amount" = 0) OR ("length"(TRIM(BOTH FROM "adjustment_reason")) > 0))),
    CONSTRAINT "payouts_amounts_check" CHECK ((("base_amount" >= 0) AND ("views_bonus" >= 0) AND ("registrant_bonus" >= 0) AND ("total_amount" >= 0))),
    CONSTRAINT "payouts_approval_check" CHECK ((("status" = 'draf'::"public"."payout_status") OR (("approved_by" IS NOT NULL) AND ("approved_at" IS NOT NULL)))),
    CONSTRAINT "payouts_paid_check" CHECK ((("status" = 'dibayar'::"public"."payout_status") = (("paid_at" IS NOT NULL) AND ("transfer_proof_path" IS NOT NULL))))
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."creator_portal_payouts" WITH ("security_invoker"='off') AS
 SELECT "p"."id",
    "p"."campaign_creator_id",
    "cc"."campaign_id",
    "p"."base_amount",
    "p"."views_bonus",
    "p"."registrant_bonus",
    "p"."adjustment_amount",
    "p"."adjustment_reason",
    "p"."total_amount",
    "p"."status",
    "p"."paid_at",
    "p"."calculated_at"
   FROM ("public"."payouts" "p"
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "p"."campaign_creator_id")))
  WHERE ("cc"."creator_id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_payouts" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_payouts" IS 'FR-M13-07: the creator''s own fee, without the transfer proof or the internal calculation snapshot.';



CREATE OR REPLACE VIEW "public"."creator_portal_profile" WITH ("security_invoker"='off') AS
 SELECT "id",
    "full_name",
    "stage_name",
    "phone_wa",
    "email",
    "city",
    "province",
    "tier",
    "status",
    "terms_version",
    "terms_agreed_at",
    "portal_invited_at",
    "verification_code",
    "verified_at" AS "local_badge_at",
    "signup_source",
    "deletion_requested_at",
    "birth_date"
   FROM "public"."creators" "c"
  WHERE ("id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_profile" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_profile" IS 'FR-M13-02: the signed-in creator''s own record, without internal notes.';



CREATE OR REPLACE VIEW "public"."creator_portal_reviews" WITH ("security_invoker"='off') AS
 SELECT "r"."id",
    "r"."content_id",
    "r"."decision",
    "r"."notes",
    "r"."created_at"
   FROM (("public"."content_reviews" "r"
     JOIN "public"."contents" "c" ON (("c"."id" = "r"."content_id")))
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "c"."campaign_creator_id")))
  WHERE ("cc"."creator_id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_reviews" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_reviews" IS 'FR-M13-05: review decisions and notes for the creator, without the internal checklist or reviewer.';



CREATE TABLE IF NOT EXISTS "public"."creator_social_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "platform" "public"."social_platform" NOT NULL,
    "handle" "text" NOT NULL,
    "profile_url" "text" DEFAULT ''::"text" NOT NULL,
    "followers_count" integer DEFAULT 0 NOT NULL,
    "kalimantan_audience_pct" numeric(5,2),
    "top_cities" "text" DEFAULT ''::"text" NOT NULL,
    "audience_proof_path" "text",
    "last_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "badge_requested_at" timestamp with time zone,
    "badge_review_notes" "text",
    CONSTRAINT "creator_social_accounts_followers_check" CHECK (("followers_count" >= 0)),
    CONSTRAINT "creator_social_accounts_handle_check" CHECK (("length"(TRIM(BOTH FROM "handle")) > 0)),
    CONSTRAINT "creator_social_accounts_pct_check" CHECK ((("kalimantan_audience_pct" IS NULL) OR (("kalimantan_audience_pct" >= (0)::numeric) AND ("kalimantan_audience_pct" <= (100)::numeric))))
);


ALTER TABLE "public"."creator_social_accounts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."creator_portal_social_accounts" WITH ("security_invoker"='off') AS
 SELECT "id",
    "platform",
    "handle",
    "profile_url",
    "followers_count",
    "kalimantan_audience_pct",
    "top_cities",
    "audience_proof_path",
    "last_verified_at",
    "badge_requested_at",
    "badge_review_notes",
    "created_at"
   FROM "public"."creator_social_accounts" "s"
  WHERE ("creator_id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_social_accounts" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_social_accounts" IS 'FR-M3-03, FR-M16-08: the signed-in creator''s own social accounts and badge requests.';



CREATE TABLE IF NOT EXISTS "public"."metric_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "checkpoint" "public"."metric_checkpoint" NOT NULL,
    "captured_at" timestamp with time zone NOT NULL,
    "views" bigint DEFAULT 0 NOT NULL,
    "likes" bigint DEFAULT 0 NOT NULL,
    "comments" bigint DEFAULT 0 NOT NULL,
    "shares" bigint DEFAULT 0 NOT NULL,
    "saves" bigint DEFAULT 0 NOT NULL,
    "proof_path" "text" NOT NULL,
    "status" "public"."submission_status" DEFAULT 'menunggu'::"public"."submission_status" NOT NULL,
    "review_notes" "text" DEFAULT ''::"text" NOT NULL,
    "submitted_by" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "snapshot_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_views" bigint,
    "credited_amount" bigint,
    "credit_limited" boolean DEFAULT false NOT NULL,
    CONSTRAINT "metric_submissions_counts_check" CHECK ((("views" >= 0) AND ("likes" >= 0) AND ("comments" >= 0) AND ("shares" >= 0) AND ("saves" >= 0))),
    CONSTRAINT "metric_submissions_credited_amount_check" CHECK ((("credited_amount" IS NULL) OR ("credited_amount" >= 0))),
    CONSTRAINT "metric_submissions_proof_check" CHECK (("length"(TRIM(BOTH FROM "proof_path")) > 0)),
    CONSTRAINT "metric_submissions_rejected_notes_check" CHECK ((("status" <> 'ditolak'::"public"."submission_status") OR ("length"(TRIM(BOTH FROM "review_notes")) > 0))),
    CONSTRAINT "metric_submissions_reviewed_pair_check" CHECK ((("status" = 'menunggu'::"public"."submission_status") = ("reviewed_at" IS NULL))),
    CONSTRAINT "metric_submissions_verified_views_check" CHECK ((("verified_views" IS NULL) OR ("verified_views" >= 0)))
);


ALTER TABLE "public"."metric_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."metric_submissions" IS 'Metric numbers sent by a creator from the portal; official only once the team accepts them (FR-M13-06).';



COMMENT ON COLUMN "public"."metric_submissions"."credit_limited" IS 'PRD 8.6: the credit was cut by the per-kliper cap or the remaining budget ("dibatasi batas kampanye").';



CREATE OR REPLACE VIEW "public"."creator_portal_submissions" WITH ("security_invoker"='off') AS
 SELECT "s"."id",
    "s"."content_id",
    "s"."checkpoint",
    "s"."captured_at",
    "s"."views",
    "s"."likes",
    "s"."comments",
    "s"."shares",
    "s"."saves",
    "s"."proof_path",
    "s"."status",
    "s"."review_notes",
    "s"."reviewed_at",
    "s"."created_at",
    "s"."verified_views",
    "s"."credited_amount",
    "s"."credit_limited"
   FROM (("public"."metric_submissions" "s"
     JOIN "public"."contents" "c" ON (("c"."id" = "s"."content_id")))
     JOIN "public"."campaign_creators" "cc" ON (("cc"."id" = "c"."campaign_creator_id")))
  WHERE ("cc"."creator_id" = "public"."current_creator_id"());


ALTER VIEW "public"."creator_portal_submissions" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_submissions" IS 'FR-M13-06, FR-M18-05: the kliper''s own submissions, how they were verified and what they credited.';



CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "amount" bigint NOT NULL,
    "bank_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "status" "public"."withdrawal_status" DEFAULT 'diajukan'::"public"."withdrawal_status" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "paid_at" "date",
    "transfer_proof_path" "text",
    "transfer_fee" bigint DEFAULT 0 NOT NULL,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "withdrawals_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "withdrawals_paid_check" CHECK ((("status" <> 'dibayar'::"public"."withdrawal_status") OR (("paid_at" IS NOT NULL) AND ("length"(TRIM(BOTH FROM COALESCE("transfer_proof_path", ''::"text"))) > 0)))),
    CONSTRAINT "withdrawals_rejected_check" CHECK ((("status" <> 'ditolak'::"public"."withdrawal_status") OR ("length"(TRIM(BOTH FROM COALESCE("rejection_reason", ''::"text"))) > 0))),
    CONSTRAINT "withdrawals_transfer_fee_check" CHECK ((("transfer_fee" >= 0) AND ("transfer_fee" < "amount")))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


COMMENT ON TABLE "public"."withdrawals" IS 'FR-M19-05, FR-M19-06: balance withdrawals. Owner only; the kliper reads a masked copy through creator_portal_withdrawals.';



CREATE OR REPLACE VIEW "public"."creator_portal_withdrawals" WITH ("security_invoker"='off') AS
 SELECT "id",
    "amount",
    "bank_name",
    ("repeat"('*'::"text", GREATEST(("length"("account_number") - 4), 0)) || "right"("account_number", 4)) AS "account_number_masked",
    "account_holder",
    "status",
    "requested_at",
    "processed_at",
    "paid_at",
    "rejection_reason",
    "transfer_fee",
    ("amount" - "transfer_fee") AS "net_amount"
   FROM "public"."withdrawals" "w"
  WHERE ("creator_id" = "public"."current_creator_account_id"());


ALTER VIEW "public"."creator_portal_withdrawals" OWNER TO "postgres";


COMMENT ON VIEW "public"."creator_portal_withdrawals" IS 'FR-M19-07: the kliper''s withdrawals, account number masked, without the transfer proof.';



CREATE TABLE IF NOT EXISTS "public"."ops_time_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "activity" "public"."ops_activity" NOT NULL,
    "minutes" integer NOT NULL,
    "log_date" "date" NOT NULL,
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ops_time_logs_minutes_check" CHECK ((("minutes" >= 1) AND ("minutes" <= 1440))),
    CONSTRAINT "ops_time_logs_notes_check" CHECK (("length"("notes") <= 1000))
);


ALTER TABLE "public"."ops_time_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "id" boolean DEFAULT true NOT NULL,
    "min_withdrawal" bigint DEFAULT 100000 NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "platform_settings_min_withdrawal_check" CHECK ((("min_withdrawal" >= 10000) AND ("min_withdrawal" <= 100000000))),
    CONSTRAINT "platform_settings_singleton" CHECK ("id")
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."platform_settings" IS 'Platform-wide settings the owner changes from the app (one row). min_withdrawal: FR-M19-05.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'manager'::"public"."user_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "timezone" "text" DEFAULT 'Asia/Makassar'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    CONSTRAINT "profiles_timezone_check" CHECK (("timezone" = ANY (ARRAY['Asia/Makassar'::"text", 'Asia/Jakarta'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Internal team members. Created from auth.users; public signup is disabled.';



CREATE TABLE IF NOT EXISTS "public"."report_share_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "last_viewed_at" timestamp with time zone,
    "view_count" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "report_share_links_expiry_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "created_at"))),
    CONSTRAINT "report_share_links_revoked_check" CHECK ((("revoked_at" IS NULL) = ("revoked_by" IS NULL))),
    CONSTRAINT "report_share_links_token_hash_check" CHECK (("token_hash" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "report_share_links_view_count_check" CHECK (("view_count" >= 0))
);


ALTER TABLE "public"."report_share_links" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_assets"
    ADD CONSTRAINT "campaign_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_campaign_creator_key" UNIQUE ("campaign_id", "creator_id");



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_tracking_slug_key" UNIQUE ("tracking_slug");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."client_payments"
    ADD CONSTRAINT "client_payments_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."client_payments"
    ADD CONSTRAINT "client_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_reviews"
    ADD CONSTRAINT "content_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_bank_accounts"
    ADD CONSTRAINT "creator_bank_accounts_creator_id_key" UNIQUE ("creator_id");



ALTER TABLE ONLY "public"."creator_bank_accounts"
    ADD CONSTRAINT "creator_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_social_accounts"
    ADD CONSTRAINT "creator_social_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creator_social_accounts"
    ADD CONSTRAINT "creator_social_accounts_platform_handle_key" UNIQUE ("platform", "handle");



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_verification_code_key" UNIQUE ("verification_code");



ALTER TABLE ONLY "public"."link_clicks"
    ADD CONSTRAINT "link_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metric_snapshots"
    ADD CONSTRAINT "metric_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metric_submissions"
    ADD CONSTRAINT "metric_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ops_time_logs"
    ADD CONSTRAINT "ops_time_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_campaign_creator_id_key" UNIQUE ("campaign_creator_id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrant_reports"
    ADD CONSTRAINT "registrant_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_share_links"
    ADD CONSTRAINT "report_share_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_share_links"
    ADD CONSTRAINT "report_share_links_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



CREATE INDEX "activity_logs_actor_idx" ON "public"."activity_logs" USING "btree" ("actor_id");



CREATE INDEX "activity_logs_created_at_idx" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "activity_logs_entity_idx" ON "public"."activity_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "campaign_assets_campaign_idx" ON "public"."campaign_assets" USING "btree" ("campaign_id");



CREATE INDEX "campaign_creators_campaign_idx" ON "public"."campaign_creators" USING "btree" ("campaign_id");



CREATE INDEX "campaign_creators_creator_idx" ON "public"."campaign_creators" USING "btree" ("creator_id");



CREATE INDEX "campaigns_catalog_idx" ON "public"."campaigns" USING "btree" ("status", "access", "end_date");



CREATE INDEX "campaigns_client_idx" ON "public"."campaigns" USING "btree" ("client_id");



CREATE INDEX "campaigns_start_date_idx" ON "public"."campaigns" USING "btree" ("start_date" DESC);



CREATE INDEX "campaigns_status_idx" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "client_contacts_client_idx" ON "public"."client_contacts" USING "btree" ("client_id");



CREATE UNIQUE INDEX "client_contacts_one_primary_idx" ON "public"."client_contacts" USING "btree" ("client_id") WHERE "is_primary";



CREATE INDEX "client_payments_campaign_idx" ON "public"."client_payments" USING "btree" ("campaign_id");



CREATE INDEX "client_payments_status_idx" ON "public"."client_payments" USING "btree" ("status");



CREATE INDEX "clients_name_idx" ON "public"."clients" USING "btree" ("lower"("name"));



CREATE INDEX "clients_province_idx" ON "public"."clients" USING "btree" ("province");



CREATE INDEX "clients_type_idx" ON "public"."clients" USING "btree" ("type");



CREATE INDEX "content_reviews_content_idx" ON "public"."content_reviews" USING "btree" ("content_id", "created_at");



CREATE INDEX "contents_assignment_idx" ON "public"."contents" USING "btree" ("campaign_creator_id");



CREATE INDEX "contents_posted_at_idx" ON "public"."contents" USING "btree" ("posted_at") WHERE ("posted_at" IS NOT NULL);



CREATE UNIQUE INDEX "contents_posted_url_normalized_key" ON "public"."contents" USING "btree" ("posted_url_normalized") WHERE (("posted_url_normalized" IS NOT NULL) AND ("review_status" <> 'ditolak'::"public"."review_status"));



CREATE INDEX "contents_review_status_idx" ON "public"."contents" USING "btree" ("review_status", "created_at");



CREATE INDEX "creator_ledger_entries_campaign_idx" ON "public"."creator_ledger_entries" USING "btree" ("campaign_id");



CREATE INDEX "creator_ledger_entries_content_idx" ON "public"."creator_ledger_entries" USING "btree" ("content_id");



CREATE INDEX "creator_ledger_entries_creator_idx" ON "public"."creator_ledger_entries" USING "btree" ("creator_id", "created_at");



CREATE INDEX "creator_social_accounts_creator_idx" ON "public"."creator_social_accounts" USING "btree" ("creator_id");



CREATE INDEX "creator_social_accounts_platform_idx" ON "public"."creator_social_accounts" USING "btree" ("platform");



CREATE INDEX "creators_city_idx" ON "public"."creators" USING "btree" ("city");



CREATE INDEX "creators_name_idx" ON "public"."creators" USING "btree" ("lower"("full_name"), "lower"("stage_name"));



CREATE INDEX "creators_niches_idx" ON "public"."creators" USING "gin" ("niches");



CREATE UNIQUE INDEX "creators_phone_wa_key" ON "public"."creators" USING "btree" ("phone_wa") WHERE (("phone_wa" <> ''::"text") AND ("anonymized_at" IS NULL));



CREATE INDEX "creators_province_idx" ON "public"."creators" USING "btree" ("province");



CREATE INDEX "creators_signup_source_idx" ON "public"."creators" USING "btree" ("signup_source");



CREATE INDEX "creators_status_idx" ON "public"."creators" USING "btree" ("status");



CREATE INDEX "creators_tier_idx" ON "public"."creators" USING "btree" ("tier");



CREATE INDEX "link_clicks_assignment_idx" ON "public"."link_clicks" USING "btree" ("campaign_creator_id", "clicked_at");



CREATE UNIQUE INDEX "metric_snapshots_checkpoint_key" ON "public"."metric_snapshots" USING "btree" ("content_id", "checkpoint") WHERE ("checkpoint" <> 'lainnya'::"public"."metric_checkpoint");



CREATE INDEX "metric_snapshots_content_idx" ON "public"."metric_snapshots" USING "btree" ("content_id", "captured_at");



CREATE INDEX "metric_submissions_content_idx" ON "public"."metric_submissions" USING "btree" ("content_id");



CREATE UNIQUE INDEX "metric_submissions_pending_idx" ON "public"."metric_submissions" USING "btree" ("content_id", "checkpoint") WHERE ("status" = 'menunggu'::"public"."submission_status");



CREATE INDEX "metric_submissions_status_idx" ON "public"."metric_submissions" USING "btree" ("status", "created_at");



CREATE INDEX "ops_time_logs_campaign_idx" ON "public"."ops_time_logs" USING "btree" ("campaign_id", "log_date" DESC);



CREATE INDEX "payouts_status_idx" ON "public"."payouts" USING "btree" ("status");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("lower"("email"));



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "registrant_reports_assignment_idx" ON "public"."registrant_reports" USING "btree" ("campaign_creator_id");



CREATE INDEX "registrant_reports_campaign_idx" ON "public"."registrant_reports" USING "btree" ("campaign_id");



CREATE UNIQUE INDEX "report_share_links_one_open_idx" ON "public"."report_share_links" USING "btree" ("campaign_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "withdrawals_creator_idx" ON "public"."withdrawals" USING "btree" ("creator_id", "requested_at");



CREATE UNIQUE INDEX "withdrawals_one_open_idx" ON "public"."withdrawals" USING "btree" ("creator_id") WHERE ("status" = ANY (ARRAY['diajukan'::"public"."withdrawal_status", 'diproses'::"public"."withdrawal_status"]));



CREATE INDEX "withdrawals_status_idx" ON "public"."withdrawals" USING "btree" ("status", "requested_at");



CREATE OR REPLACE TRIGGER "campaign_assets_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."campaign_assets" FOR EACH ROW EXECUTE FUNCTION "public"."guard_campaign_asset_change"();



CREATE OR REPLACE TRIGGER "campaign_assets_set_updated_at" BEFORE UPDATE ON "public"."campaign_assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "campaign_creators_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."campaign_creators" FOR EACH ROW EXECUTE FUNCTION "public"."guard_campaign_creator_change"();



CREATE OR REPLACE TRIGGER "campaign_creators_guard_portal" BEFORE UPDATE ON "public"."campaign_creators" FOR EACH ROW EXECUTE FUNCTION "public"."guard_portal_assignment_confirm"();



CREATE OR REPLACE TRIGGER "campaign_creators_set_updated_at" BEFORE UPDATE ON "public"."campaign_creators" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "campaign_creators_withdraw_pending_clips" AFTER UPDATE OF "status" ON "public"."campaign_creators" FOR EACH ROW EXECUTE FUNCTION "public"."withdraw_pending_clips"();



CREATE OR REPLACE TRIGGER "campaigns_clear_objective" BEFORE INSERT OR UPDATE OF "objective", "payout_model" ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."clear_campaign_objective"();



CREATE OR REPLACE TRIGGER "campaigns_guard" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."guard_campaign_update"();



CREATE OR REPLACE TRIGGER "campaigns_guard_insert" BEFORE INSERT ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."guard_campaign_insert"();



CREATE OR REPLACE TRIGGER "campaigns_set_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "client_contacts_protect_portal_link" BEFORE UPDATE ON "public"."client_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."protect_client_portal_link"();



CREATE OR REPLACE TRIGGER "client_contacts_set_updated_at" BEFORE UPDATE ON "public"."client_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "client_payments_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."client_payments" FOR EACH ROW EXECUTE FUNCTION "public"."guard_client_payment_change"();



CREATE OR REPLACE TRIGGER "client_payments_set_updated_at" BEFORE UPDATE ON "public"."client_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "clients_set_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "content_reviews_apply" AFTER INSERT ON "public"."content_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."apply_content_review"();



CREATE OR REPLACE TRIGGER "content_reviews_guard_insert" BEFORE INSERT ON "public"."content_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."guard_content_review_insert"();



CREATE OR REPLACE TRIGGER "content_reviews_immutable" BEFORE DELETE OR UPDATE ON "public"."content_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_content_review_change"();



CREATE CONSTRAINT TRIGGER "contents_clip_needs_submission" AFTER INSERT ON "public"."contents" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."assert_clip_has_submission"();



CREATE OR REPLACE TRIGGER "contents_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."guard_content_change"();



CREATE OR REPLACE TRIGGER "contents_guard_clip" BEFORE INSERT OR UPDATE ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."guard_clip_change"();



CREATE OR REPLACE TRIGGER "contents_guard_portal" BEFORE INSERT OR UPDATE ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."guard_portal_content_change"();



CREATE OR REPLACE TRIGGER "contents_set_updated_at" BEFORE UPDATE ON "public"."contents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "creator_bank_accounts_guard_anonymized" BEFORE INSERT OR UPDATE ON "public"."creator_bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."guard_anonymized_creator"();



CREATE OR REPLACE TRIGGER "creator_bank_accounts_set_updated_at" BEFORE UPDATE ON "public"."creator_bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "creator_bank_accounts_track_change" BEFORE INSERT OR UPDATE ON "public"."creator_bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."track_bank_account_change"();



CREATE OR REPLACE TRIGGER "creator_ledger_entries_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."creator_ledger_entries" FOR EACH ROW EXECUTE FUNCTION "public"."guard_ledger_entry"();



CREATE OR REPLACE TRIGGER "creator_social_accounts_activate_creator" AFTER INSERT ON "public"."creator_social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."activate_self_registered_creator"();



CREATE OR REPLACE TRIGGER "creator_social_accounts_guard_anonymized" BEFORE INSERT OR UPDATE ON "public"."creator_social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."guard_anonymized_creator"();



CREATE OR REPLACE TRIGGER "creator_social_accounts_guard_portal" BEFORE INSERT OR UPDATE ON "public"."creator_social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."guard_portal_social_account"();



CREATE OR REPLACE TRIGGER "creator_social_accounts_set_updated_at" BEFORE UPDATE ON "public"."creator_social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "creators_guard_anonymize_balance" BEFORE UPDATE OF "anonymized_at" ON "public"."creators" FOR EACH ROW EXECUTE FUNCTION "public"."guard_creator_anonymize_balance"();



CREATE OR REPLACE TRIGGER "creators_guard_anonymized" BEFORE UPDATE ON "public"."creators" FOR EACH ROW EXECUTE FUNCTION "public"."guard_anonymized_creator"();



CREATE OR REPLACE TRIGGER "creators_guard_block" BEFORE UPDATE OF "status" ON "public"."creators" FOR EACH ROW EXECUTE FUNCTION "public"."guard_creator_block"();



CREATE OR REPLACE TRIGGER "creators_protect_portal_link" BEFORE UPDATE ON "public"."creators" FOR EACH ROW EXECUTE FUNCTION "public"."protect_creator_portal_link"();



CREATE OR REPLACE TRIGGER "creators_set_updated_at" BEFORE UPDATE ON "public"."creators" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "metric_snapshots_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."metric_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."guard_metric_snapshot_change"();



CREATE OR REPLACE TRIGGER "metric_snapshots_set_updated_at" BEFORE UPDATE ON "public"."metric_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "metric_submissions_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."metric_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."guard_metric_submission_change"();



CREATE OR REPLACE TRIGGER "metric_submissions_set_updated_at" BEFORE UPDATE ON "public"."metric_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "ops_time_logs_guard" BEFORE UPDATE ON "public"."ops_time_logs" FOR EACH ROW EXECUTE FUNCTION "public"."guard_ops_time_log_change"();



CREATE OR REPLACE TRIGGER "ops_time_logs_set_updated_at" BEFORE UPDATE ON "public"."ops_time_logs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "payouts_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."guard_payout_change"();



CREATE OR REPLACE TRIGGER "payouts_set_updated_at" BEFORE UPDATE ON "public"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "platform_settings_set_updated_at" BEFORE UPDATE ON "public"."platform_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_protect_privileges" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_privileges"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "registrant_reports_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."registrant_reports" FOR EACH ROW EXECUTE FUNCTION "public"."guard_registrant_report_change"();



CREATE OR REPLACE TRIGGER "registrant_reports_set_updated_at" BEFORE UPDATE ON "public"."registrant_reports" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "report_share_links_guard" BEFORE INSERT OR UPDATE ON "public"."report_share_links" FOR EACH ROW EXECUTE FUNCTION "public"."guard_report_share_link"();



CREATE OR REPLACE TRIGGER "withdrawals_guard" BEFORE INSERT OR DELETE OR UPDATE ON "public"."withdrawals" FOR EACH ROW EXECUTE FUNCTION "public"."guard_withdrawal_change"();



CREATE OR REPLACE TRIGGER "withdrawals_set_updated_at" BEFORE UPDATE ON "public"."withdrawals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_assets"
    ADD CONSTRAINT "campaign_assets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_assets"
    ADD CONSTRAINT "campaign_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_creators"
    ADD CONSTRAINT "campaign_creators_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_payments"
    ADD CONSTRAINT "client_payments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."client_payments"
    ADD CONSTRAINT "client_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_reviews"
    ADD CONSTRAINT "content_reviews_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."content_reviews"
    ADD CONSTRAINT "content_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_campaign_creator_id_fkey" FOREIGN KEY ("campaign_creator_id") REFERENCES "public"."campaign_creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contents"
    ADD CONSTRAINT "contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."creator_bank_accounts"
    ADD CONSTRAINT "creator_bank_accounts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_metric_submission_id_fkey" FOREIGN KEY ("metric_submission_id") REFERENCES "public"."metric_submissions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creator_ledger_entries"
    ADD CONSTRAINT "creator_ledger_entries_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."creator_social_accounts"
    ADD CONSTRAINT "creator_social_accounts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."creators"
    ADD CONSTRAINT "creators_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."link_clicks"
    ADD CONSTRAINT "link_clicks_campaign_creator_id_fkey" FOREIGN KEY ("campaign_creator_id") REFERENCES "public"."campaign_creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."metric_snapshots"
    ADD CONSTRAINT "metric_snapshots_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."metric_snapshots"
    ADD CONSTRAINT "metric_snapshots_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."metric_submissions"
    ADD CONSTRAINT "metric_submissions_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."metric_submissions"
    ADD CONSTRAINT "metric_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."metric_submissions"
    ADD CONSTRAINT "metric_submissions_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."metric_snapshots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."metric_submissions"
    ADD CONSTRAINT "metric_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ops_time_logs"
    ADD CONSTRAINT "ops_time_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ops_time_logs"
    ADD CONSTRAINT "ops_time_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_campaign_creator_id_fkey" FOREIGN KEY ("campaign_creator_id") REFERENCES "public"."campaign_creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrant_reports"
    ADD CONSTRAINT "registrant_reports_campaign_creator_id_fkey" FOREIGN KEY ("campaign_creator_id") REFERENCES "public"."campaign_creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrant_reports"
    ADD CONSTRAINT "registrant_reports_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrant_reports"
    ADD CONSTRAINT "registrant_reports_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."report_share_links"
    ADD CONSTRAINT "report_share_links_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_share_links"
    ADD CONSTRAINT "report_share_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."report_share_links"
    ADD CONSTRAINT "report_share_links_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_logs_insert_own" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_member"() AND ("actor_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "activity_logs_insert_portal_client" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."current_client_id"() IS NOT NULL) AND ("actor_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "activity_logs_insert_portal_creator" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."current_creator_id"() IS NOT NULL) AND ("actor_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "activity_logs_select_owner" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING ("public"."is_owner"());



ALTER TABLE "public"."campaign_assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_assets_delete_active_members" ON "public"."campaign_assets" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "campaign_assets_insert_active_members" ON "public"."campaign_assets" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "campaign_assets_select_active_members" ON "public"."campaign_assets" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "campaign_assets_update_active_members" ON "public"."campaign_assets" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."campaign_creators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_creators_delete_active_members" ON "public"."campaign_creators" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "campaign_creators_insert_active_members" ON "public"."campaign_creators" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "campaign_creators_insert_portal_creator" ON "public"."campaign_creators" FOR INSERT TO "authenticated" WITH CHECK ((("creator_id" = "public"."current_creator_id"()) AND "public"."campaign_open_for_catalog"("campaign_id")));



CREATE POLICY "campaign_creators_select_active_members" ON "public"."campaign_creators" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "campaign_creators_select_portal_creator" ON "public"."campaign_creators" FOR SELECT TO "authenticated" USING ("public"."creator_owns_assignment"("id"));



CREATE POLICY "campaign_creators_update_active_members" ON "public"."campaign_creators" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



CREATE POLICY "campaign_creators_update_portal_creator" ON "public"."campaign_creators" FOR UPDATE TO "authenticated" USING ("public"."creator_owns_assignment"("id")) WITH CHECK ("public"."creator_owns_assignment"("id"));



ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_delete_owner" ON "public"."campaigns" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "campaigns_insert_active_members" ON "public"."campaigns" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_member"() AND ("status" = 'draft'::"public"."campaign_status")));



CREATE POLICY "campaigns_select_active_members" ON "public"."campaigns" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "campaigns_update_active_members" ON "public"."campaigns" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."client_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_contacts_delete_active_members" ON "public"."client_contacts" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "client_contacts_insert_active_members" ON "public"."client_contacts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "client_contacts_select_active_members" ON "public"."client_contacts" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "client_contacts_update_active_members" ON "public"."client_contacts" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."client_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_payments_delete_owner" ON "public"."client_payments" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "client_payments_insert_active_members" ON "public"."client_payments" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "client_payments_select_active_members" ON "public"."client_payments" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "client_payments_update_active_members" ON "public"."client_payments" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_delete_owner" ON "public"."clients" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "clients_insert_active_members" ON "public"."clients" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "clients_select_active_members" ON "public"."clients" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "clients_update_active_members" ON "public"."clients" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."content_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_reviews_insert_active_members" ON "public"."content_reviews" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "content_reviews_select_active_members" ON "public"."content_reviews" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



ALTER TABLE "public"."contents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contents_delete_active_members" ON "public"."contents" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "contents_insert_active_members" ON "public"."contents" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "contents_insert_portal_creator" ON "public"."contents" FOR INSERT TO "authenticated" WITH CHECK ("public"."creator_joined_assignment"("campaign_creator_id"));



CREATE POLICY "contents_select_active_members" ON "public"."contents" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "contents_select_portal_creator" ON "public"."contents" FOR SELECT TO "authenticated" USING ("public"."creator_owns_content"("id"));



CREATE POLICY "contents_update_active_members" ON "public"."contents" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



CREATE POLICY "contents_update_portal_creator" ON "public"."contents" FOR UPDATE TO "authenticated" USING ("public"."creator_joined_assignment"("campaign_creator_id")) WITH CHECK ("public"."creator_joined_assignment"("campaign_creator_id"));



ALTER TABLE "public"."creator_bank_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creator_bank_accounts_delete_owner" ON "public"."creator_bank_accounts" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "creator_bank_accounts_insert_owner" ON "public"."creator_bank_accounts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_owner"());



CREATE POLICY "creator_bank_accounts_select_owner" ON "public"."creator_bank_accounts" FOR SELECT TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "creator_bank_accounts_update_owner" ON "public"."creator_bank_accounts" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



ALTER TABLE "public"."creator_ledger_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creator_ledger_entries_select_active_members" ON "public"."creator_ledger_entries" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



ALTER TABLE "public"."creator_social_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creator_social_accounts_delete_active_members" ON "public"."creator_social_accounts" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "creator_social_accounts_delete_own" ON "public"."creator_social_accounts" FOR DELETE TO "authenticated" USING (("creator_id" = "public"."current_creator_id"()));



CREATE POLICY "creator_social_accounts_insert_active_members" ON "public"."creator_social_accounts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "creator_social_accounts_insert_own" ON "public"."creator_social_accounts" FOR INSERT TO "authenticated" WITH CHECK (("creator_id" = "public"."current_creator_id"()));



CREATE POLICY "creator_social_accounts_select_active_members" ON "public"."creator_social_accounts" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "creator_social_accounts_select_own" ON "public"."creator_social_accounts" FOR SELECT TO "authenticated" USING (("creator_id" = "public"."current_creator_id"()));



CREATE POLICY "creator_social_accounts_update_active_members" ON "public"."creator_social_accounts" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



CREATE POLICY "creator_social_accounts_update_own" ON "public"."creator_social_accounts" FOR UPDATE TO "authenticated" USING (("creator_id" = "public"."current_creator_id"())) WITH CHECK (("creator_id" = "public"."current_creator_id"()));



ALTER TABLE "public"."creators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "creators_delete_owner" ON "public"."creators" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "creators_insert_active_members" ON "public"."creators" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "creators_select_active_members" ON "public"."creators" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "creators_update_active_members" ON "public"."creators" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."link_clicks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "link_clicks_select_active_members" ON "public"."link_clicks" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



ALTER TABLE "public"."metric_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "metric_snapshots_delete_active_members" ON "public"."metric_snapshots" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "metric_snapshots_insert_active_members" ON "public"."metric_snapshots" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "metric_snapshots_select_active_members" ON "public"."metric_snapshots" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "metric_snapshots_update_active_members" ON "public"."metric_snapshots" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."metric_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "metric_submissions_delete_portal_creator" ON "public"."metric_submissions" FOR DELETE TO "authenticated" USING ((("status" = 'menunggu'::"public"."submission_status") AND "public"."creator_owns_content"("content_id")));



CREATE POLICY "metric_submissions_insert_portal_creator" ON "public"."metric_submissions" FOR INSERT TO "authenticated" WITH CHECK ("public"."creator_joined_content"("content_id"));



CREATE POLICY "metric_submissions_select_active_members" ON "public"."metric_submissions" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "metric_submissions_select_portal_creator" ON "public"."metric_submissions" FOR SELECT TO "authenticated" USING ("public"."creator_owns_content"("content_id"));



ALTER TABLE "public"."ops_time_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ops_time_logs_delete_own_or_owner" ON "public"."ops_time_logs" FOR DELETE TO "authenticated" USING (("public"."is_active_member"() AND (("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_owner"())));



CREATE POLICY "ops_time_logs_insert_own" ON "public"."ops_time_logs" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_member"() AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "ops_time_logs_select_active_members" ON "public"."ops_time_logs" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "ops_time_logs_update_own_or_owner" ON "public"."ops_time_logs" FOR UPDATE TO "authenticated" USING (("public"."is_active_member"() AND (("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_owner"()))) WITH CHECK (("public"."is_active_member"() AND (("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_owner"())));



ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payouts_delete_owner" ON "public"."payouts" FOR DELETE TO "authenticated" USING ("public"."is_owner"());



CREATE POLICY "payouts_insert_active_members" ON "public"."payouts" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "payouts_select_active_members" ON "public"."payouts" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "payouts_update_active_members" ON "public"."payouts" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "platform_settings_select_active_members" ON "public"."platform_settings" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "platform_settings_update_owner" ON "public"."platform_settings" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_owner_update_all" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ("public"."is_owner"()) WITH CHECK ("public"."is_owner"());



CREATE POLICY "profiles_select_all_active_members" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_active_member"())) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "profiles_update_own_portal_client" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND ("public"."current_client_id"() IS NOT NULL))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "profiles_update_own_portal_creator" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND ("public"."current_creator_id"() IS NOT NULL))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."registrant_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registrant_reports_delete_active_members" ON "public"."registrant_reports" FOR DELETE TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "registrant_reports_insert_active_members" ON "public"."registrant_reports" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_active_member"());



CREATE POLICY "registrant_reports_select_active_members" ON "public"."registrant_reports" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "registrant_reports_update_active_members" ON "public"."registrant_reports" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."report_share_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_share_links_insert_active_members" ON "public"."report_share_links" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_active_member"() AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "report_share_links_select_active_members" ON "public"."report_share_links" FOR SELECT TO "authenticated" USING ("public"."is_active_member"());



CREATE POLICY "report_share_links_update_active_members" ON "public"."report_share_links" FOR UPDATE TO "authenticated" USING ("public"."is_active_member"()) WITH CHECK ("public"."is_active_member"());



ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "withdrawals_select_owner" ON "public"."withdrawals" FOR SELECT TO "authenticated" USING ("public"."is_owner"());





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."accept_creator_terms"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_creator_terms"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_creator_terms"() TO "service_role";



GRANT ALL ON FUNCTION "public"."activate_self_registered_creator"() TO "anon";
GRANT ALL ON FUNCTION "public"."activate_self_registered_creator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_self_registered_creator"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."adjust_balance"("p_creator_id" "uuid", "p_amount" bigint, "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."adjust_balance"("p_creator_id" "uuid", "p_amount" bigint, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."adjust_balance"("p_creator_id" "uuid", "p_amount" bigint, "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."anonymize_creator"("target_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."anonymize_creator"("target_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."anonymize_creator"("target_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_content_review"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_content_review"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_content_review"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_campaign_editable"("p_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_campaign_editable"("p_campaign_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assert_clip_has_submission"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_clip_has_submission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_clip_has_submission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assignment_payout_model"("target_assignment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assignment_payout_model"("target_assignment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."campaign_budget_exhausted"("target_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."campaign_budget_exhausted"("target_campaign_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."campaign_creator_cost"("target_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."campaign_creator_cost"("target_campaign_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."campaign_open_for_catalog"("target_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."campaign_open_for_catalog"("target_campaign_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."campaign_today"() TO "anon";
GRANT ALL ON FUNCTION "public"."campaign_today"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."campaign_today"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_clip"("p_content_id" "uuid", "p_kind" "text", "p_removed_at" timestamp with time zone, "p_rejection_reason" "public"."clip_rejection_reason", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_clip"("p_content_id" "uuid", "p_kind" "text", "p_removed_at" timestamp with time zone, "p_rejection_reason" "public"."clip_rejection_reason", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_clip"("p_content_id" "uuid", "p_kind" "text", "p_removed_at" timestamp with time zone, "p_rejection_reason" "public"."clip_rejection_reason", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_campaign_objective"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_campaign_objective"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_campaign_objective"() TO "service_role";



GRANT ALL ON FUNCTION "public"."client_owns_campaign"("target_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."client_owns_campaign"("target_campaign_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."clip_credited_amount"("target_content_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clip_credited_amount"("target_content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clip_credited_amount"("target_content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."content_campaign_id"("p_campaign_creator_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."content_campaign_id"("p_campaign_creator_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."creator_assigned_to_campaign"("target_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_assigned_to_campaign"("target_campaign_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."creator_balance"("target_creator_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."creator_balance"("target_creator_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."creator_can_view_campaign_assets"("target_campaign_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_can_view_campaign_assets"("target_campaign_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."creator_joined_assignment"("target_assignment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_joined_assignment"("target_assignment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."creator_joined_content"("target_content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_joined_content"("target_content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."creator_owns_assignment"("target_assignment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_owns_assignment"("target_assignment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."creator_owns_content"("target_content_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_owns_content"("target_content_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_client_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_client_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_creator_account_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_creator_account_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_creator_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_creator_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_creator_terms_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_creator_terms_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_creator_terms_version"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_min_withdrawal"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_min_withdrawal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_min_withdrawal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_referral_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_tracking_slug"("stage_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_tracking_slug"("stage_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_tracking_slug"("stage_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_verification_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_verification_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_verification_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_masked_bank_account"("p_creator_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_masked_bank_account"("p_creator_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_anonymized_creator"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_anonymized_creator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_anonymized_creator"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_campaign_asset_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_campaign_asset_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_campaign_asset_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_campaign_creator_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_campaign_creator_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_campaign_creator_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_campaign_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_campaign_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_campaign_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_campaign_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_campaign_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_campaign_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_client_payment_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_client_payment_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_client_payment_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_clip_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_clip_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_clip_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_content_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_content_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_content_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_content_review_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_content_review_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_content_review_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_creator_anonymize_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_creator_anonymize_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_creator_anonymize_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_creator_block"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_creator_block"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_creator_block"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_ledger_entry"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_ledger_entry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_ledger_entry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_metric_snapshot_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_metric_snapshot_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_metric_snapshot_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_metric_submission_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_metric_submission_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_metric_submission_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_ops_time_log_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_ops_time_log_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_ops_time_log_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_payout_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_payout_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_payout_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_portal_assignment_confirm"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_portal_assignment_confirm"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_portal_assignment_confirm"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_portal_content_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_portal_content_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_portal_content_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_portal_social_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_portal_social_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_portal_social_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_registrant_report_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_registrant_report_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_registrant_report_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_report_share_link"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_report_share_link"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_report_share_link"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_withdrawal_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_withdrawal_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_withdrawal_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_email_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_email_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_email_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_active_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_clip_url"("url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_clip_url"("url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_clip_url"("url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_person_name"("value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_person_name"("value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_person_name"("value" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."open_report_share_link"("p_token_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."open_report_share_link"("p_token_hash" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_content_review_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_content_review_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_content_review_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."process_withdrawal"("p_id" "uuid", "p_status" "public"."withdrawal_status", "p_paid_at" "date", "p_proof_path" "text", "p_reason" "text", "p_transfer_fee" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_withdrawal"("p_id" "uuid", "p_status" "public"."withdrawal_status", "p_paid_at" "date", "p_proof_path" "text", "p_reason" "text", "p_transfer_fee" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_withdrawal"("p_id" "uuid", "p_status" "public"."withdrawal_status", "p_paid_at" "date", "p_proof_path" "text", "p_reason" "text", "p_transfer_fee" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_client_portal_link"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_client_portal_link"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_client_portal_link"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_creator_portal_link"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_creator_portal_link"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_creator_portal_link"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_profile_privileges"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_profile_privileges"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_profile_privileges"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_clip_cancellation"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_clip_cancellation"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_clip_credit"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_submission_id" "uuid", "p_verified_views" bigint, "p_credit" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_clip_credit"("p_campaign_id" "uuid", "p_content_id" "uuid", "p_creator_id" "uuid", "p_submission_id" "uuid", "p_verified_views" bigint, "p_credit" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_creator_account_deletion"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_creator_account_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_creator_account_deletion"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_withdrawal"("p_amount" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_amount" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_amount" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."review_metric_submission"("p_id" "uuid", "p_accept" boolean, "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_metric_submission"("p_id" "uuid", "p_accept" boolean, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."review_metric_submission"("p_id" "uuid", "p_accept" boolean, "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_creator_bank_account"("p_bank_name" "text", "p_account_number" "text", "p_account_holder" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_creator_bank_account"("p_bank_name" "text", "p_account_number" "text", "p_account_holder" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_creator_bank_account"("p_bank_name" "text", "p_account_number" "text", "p_account_holder" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_own_birth_date"("p_birth_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_own_birth_date"("p_birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_own_birth_date"("p_birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_clip"("p_assignment_id" "uuid", "p_platform" "public"."social_platform", "p_posted_url" "text", "p_posted_at" timestamp with time zone, "p_views" bigint, "p_likes" bigint, "p_comments" bigint, "p_shares" bigint, "p_proof_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_clip"("p_assignment_id" "uuid", "p_platform" "public"."social_platform", "p_posted_url" "text", "p_posted_at" timestamp with time zone, "p_views" bigint, "p_likes" bigint, "p_comments" bigint, "p_shares" bigint, "p_proof_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_clip"("p_assignment_id" "uuid", "p_platform" "public"."social_platform", "p_posted_url" "text", "p_posted_at" timestamp with time zone, "p_views" bigint, "p_likes" bigint, "p_comments" bigint, "p_shares" bigint, "p_proof_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_bank_account_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_bank_account_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_bank_account_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."verify_clip"("p_content_id" "uuid", "p_decision" "public"."review_decision", "p_checklist" "jsonb", "p_notes" "text", "p_rejection_reason" "public"."clip_rejection_reason", "p_verified_views" bigint, "p_credit" bigint, "p_credit_limited" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_clip"("p_content_id" "uuid", "p_decision" "public"."review_decision", "p_checklist" "jsonb", "p_notes" "text", "p_rejection_reason" "public"."clip_rejection_reason", "p_verified_views" bigint, "p_credit" bigint, "p_credit_limited" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_clip"("p_content_id" "uuid", "p_decision" "public"."review_decision", "p_checklist" "jsonb", "p_notes" "text", "p_rejection_reason" "public"."clip_rejection_reason", "p_verified_views" bigint, "p_credit" bigint, "p_credit_limited" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."verify_views_update"("p_submission_id" "uuid", "p_accept" boolean, "p_verified_views" bigint, "p_notes" "text", "p_credit" bigint, "p_credit_limited" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verify_views_update"("p_submission_id" "uuid", "p_accept" boolean, "p_verified_views" bigint, "p_notes" "text", "p_credit" bigint, "p_credit_limited" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_views_update"("p_submission_id" "uuid", "p_accept" boolean, "p_verified_views" bigint, "p_notes" "text", "p_credit" bigint, "p_credit_limited" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."withdraw_pending_clips"() TO "anon";
GRANT ALL ON FUNCTION "public"."withdraw_pending_clips"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."withdraw_pending_clips"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_assets" TO "anon";
GRANT ALL ON TABLE "public"."campaign_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_assets" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_creators" TO "anon";
GRANT ALL ON TABLE "public"."campaign_creators" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_creators" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."client_contacts" TO "anon";
GRANT ALL ON TABLE "public"."client_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."client_payments" TO "anon";
GRANT ALL ON TABLE "public"."client_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."client_payments" TO "service_role";



GRANT ALL ON TABLE "public"."client_portal_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."client_portal_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."contents" TO "anon";
GRANT ALL ON TABLE "public"."contents" TO "authenticated";
GRANT ALL ON TABLE "public"."contents" TO "service_role";



GRANT ALL ON TABLE "public"."creators" TO "anon";
GRANT ALL ON TABLE "public"."creators" TO "authenticated";
GRANT ALL ON TABLE "public"."creators" TO "service_role";



GRANT ALL ON TABLE "public"."client_portal_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."client_portal_contents" TO "service_role";



GRANT ALL ON TABLE "public"."link_clicks" TO "anon";
GRANT ALL ON TABLE "public"."link_clicks" TO "authenticated";
GRANT ALL ON TABLE "public"."link_clicks" TO "service_role";



GRANT ALL ON TABLE "public"."registrant_reports" TO "anon";
GRANT ALL ON TABLE "public"."registrant_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."registrant_reports" TO "service_role";



GRANT ALL ON TABLE "public"."client_portal_creators" TO "authenticated";
GRANT ALL ON TABLE "public"."client_portal_creators" TO "service_role";



GRANT ALL ON TABLE "public"."metric_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."metric_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."metric_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."client_portal_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."client_portal_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."content_reviews" TO "anon";
GRANT ALL ON TABLE "public"."content_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."content_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."creator_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."creator_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."creator_ledger_entries" TO "anon";
GRANT ALL ON TABLE "public"."creator_ledger_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_ledger_entries" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_account" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_account" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_assets" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_balance" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_balance" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_bank_account" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_bank_account" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_contents" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_payouts" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_profile" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."creator_social_accounts" TO "anon";
GRANT ALL ON TABLE "public"."creator_social_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_social_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_social_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_social_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."metric_submissions" TO "anon";
GRANT ALL ON TABLE "public"."metric_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."metric_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawals" TO "service_role";



GRANT ALL ON TABLE "public"."creator_portal_withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_portal_withdrawals" TO "service_role";



GRANT ALL ON TABLE "public"."ops_time_logs" TO "anon";
GRANT ALL ON TABLE "public"."ops_time_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ops_time_logs" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."report_share_links" TO "anon";
GRANT ALL ON TABLE "public"."report_share_links" TO "authenticated";
GRANT ALL ON TABLE "public"."report_share_links" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































