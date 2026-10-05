-- FR-M4-01 (revised, PRD 1.3): the campaign objective only belongs to legacy
-- `paket` campaigns. Open `per_views` campaigns pay per verified views, so an
-- objective adds nothing for klipers; it stays null there. Legacy rows keep
-- their stored value for their reports.
--
-- The landing URL rule in guard_campaign_update() only fires for
-- `objective = 'pendaftar'`, so a null objective makes the landing URL
-- optional without touching that function.

alter table public.campaigns
  alter column objective drop not null,
  alter column objective drop default;

-- The existing per_views rows carry the old column default, not a choice.
update public.campaigns
set objective = null
where payout_model = 'per_views'
  and objective is not null;

-- Keeps per_views rows objective-free, including a paket draft switched to
-- per_views. Named to sort before campaigns_guard_* so the guards see the
-- cleared value.
create or replace function public.clear_campaign_objective()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.payout_model = 'per_views' then
    new.objective := null;
  end if;
  return new;
end;
$$;

create trigger campaigns_clear_objective
  before insert or update of objective, payout_model on public.campaigns
  for each row
  execute function public.clear_campaign_objective();

comment on column public.campaigns.objective is
  'FR-M4-01: legacy paket campaigns only (pendaftar/awareness/event). Always null for per_views.';
