-- Phase 1: clients and their contacts (PRD M2, section 7).

create type public.client_type as enum (
  'kampus_swasta',
  'sekolah_swasta',
  'bank_daerah',
  'bumd',
  'pemda',
  'event_organizer',
  'umkm',
  'lainnya'
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.client_type not null default 'lainnya',
  city text not null default '',
  province text not null default '',
  address text not null default '',
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_check check (length(trim(name)) > 0)
);

create index clients_name_idx on public.clients (lower(name));
create index clients_type_idx on public.clients (type);
create index clients_province_idx on public.clients (province);

create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  position text not null default '',
  phone_wa text not null default '',
  email text not null default '',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_contacts_name_check check (length(trim(name)) > 0)
);

create index client_contacts_client_idx on public.client_contacts (client_id);

-- At most one primary contact per client.
create unique index client_contacts_one_primary_idx
  on public.client_contacts (client_id)
  where is_primary;

create trigger client_contacts_set_updated_at
  before update on public.client_contacts
  for each row
  execute function public.set_updated_at();

-- Both roles run day-to-day operations on clients (PRD section 3).
alter table public.clients enable row level security;

create policy "clients_select_active_members"
  on public.clients for select to authenticated
  using (public.is_active_member());

create policy "clients_insert_active_members"
  on public.clients for insert to authenticated
  with check (public.is_active_member());

create policy "clients_update_active_members"
  on public.clients for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "clients_delete_owner"
  on public.clients for delete to authenticated
  using (public.is_owner());

alter table public.client_contacts enable row level security;

create policy "client_contacts_select_active_members"
  on public.client_contacts for select to authenticated
  using (public.is_active_member());

create policy "client_contacts_insert_active_members"
  on public.client_contacts for insert to authenticated
  with check (public.is_active_member());

create policy "client_contacts_update_active_members"
  on public.client_contacts for update to authenticated
  using (public.is_active_member())
  with check (public.is_active_member());

create policy "client_contacts_delete_active_members"
  on public.client_contacts for delete to authenticated
  using (public.is_active_member());
