-- Fix: `text[] || 'literal'` was parsed as an array literal, so every approval
-- on a campaign that requires the paid label failed. Use array_append instead.

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
      v_required := array_append(v_required, 'label_berbayar');
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
