-- Phase 1: append-only audit trail (PRD M11, FR-M11-01).

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);
create index activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index activity_logs_actor_idx on public.activity_logs (actor_id);

alter table public.activity_logs enable row level security;

-- Any active member writes entries about their own actions.
create policy "activity_logs_insert_own"
  on public.activity_logs for insert to authenticated
  with check (public.is_active_member() and actor_id = (select auth.uid()));

-- Only the owner reads the trail (FR-M11-02). No update/delete policies:
-- the table is append-only for application roles.
create policy "activity_logs_select_owner"
  on public.activity_logs for select to authenticated
  using (public.is_owner());
