-- Phase 1: private bucket for creator audience analytics screenshots
-- (PRD section 7.1). Files are served through short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audience-proofs',
  'audience-proofs',
  false,
  5 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

create policy "audience_proofs_select_active_members"
  on storage.objects for select to authenticated
  using (bucket_id = 'audience-proofs' and public.is_active_member());

create policy "audience_proofs_insert_active_members"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'audience-proofs' and public.is_active_member());

create policy "audience_proofs_update_active_members"
  on storage.objects for update to authenticated
  using (bucket_id = 'audience-proofs' and public.is_active_member())
  with check (bucket_id = 'audience-proofs' and public.is_active_member());

create policy "audience_proofs_delete_active_members"
  on storage.objects for delete to authenticated
  using (bucket_id = 'audience-proofs' and public.is_active_member());
