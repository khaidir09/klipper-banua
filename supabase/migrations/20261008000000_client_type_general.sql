-- FR-M2-01 (revised, PRD 1.4): clients are no longer only regional
-- institutions. The client type becomes a general segment: brand, umkm,
-- instansi, personal, lainnya. Old institution types map to `instansi` and
-- `event_organizer` maps to `brand`.
--
-- Postgres cannot drop enum values, so the enum is replaced: a new type is
-- created, the column is converted with an explicit mapping, and the old type
-- is dropped. No view or function reads clients.type.

create type public.client_type_v2 as enum (
  'brand',
  'umkm',
  'instansi',
  'personal',
  'lainnya'
);

alter table public.clients alter column type drop default;

alter table public.clients
  alter column type type public.client_type_v2
  using (
    case type::text
      when 'kampus_swasta' then 'instansi'
      when 'sekolah_swasta' then 'instansi'
      when 'bank_daerah' then 'instansi'
      when 'bumd' then 'instansi'
      when 'pemda' then 'instansi'
      when 'event_organizer' then 'brand'
      else type::text
    end
  )::public.client_type_v2;

drop type public.client_type;
alter type public.client_type_v2 rename to client_type;

alter table public.clients alter column type set default 'lainnya';
