-- Earlier migrations closed these helpers with `revoke execute ... from anon`,
-- but Postgres also grants EXECUTE on every new function to PUBLIC, and `anon`
-- inherits it. So `anon` could still call them through /rest/v1/rpc, e.g.
-- campaign_creator_cost() answered the honor spent on any campaign id.
-- Revoking from PUBLIC makes the old intent true; `authenticated` and
-- `service_role` keep their explicit grants. scripts/rls-check.sql now fails
-- when `anon` can execute a public function outside its allowlist.

revoke execute on function public.current_user_role() from public;
revoke execute on function public.is_owner() from public;
revoke execute on function public.is_active_member() from public;
revoke execute on function public.get_masked_bank_account(uuid) from public;
revoke execute on function public.assert_campaign_editable(uuid) from public;
revoke execute on function public.content_campaign_id(uuid) from public;
revoke execute on function public.current_creator_id() from public;
revoke execute on function public.creator_assigned_to_campaign(uuid) from public;
revoke execute on function public.creator_owns_assignment(uuid) from public;
revoke execute on function public.creator_owns_content(uuid) from public;
revoke execute on function public.current_client_id() from public;
revoke execute on function public.client_owns_campaign(uuid) from public;
revoke execute on function public.creator_joined_assignment(uuid) from public;
revoke execute on function public.creator_joined_content(uuid) from public;
revoke execute on function public.campaign_creator_cost(uuid) from public;
revoke execute on function public.campaign_budget_exhausted(uuid) from public;
revoke execute on function public.campaign_open_for_catalog(uuid) from public;
revoke execute on function public.creator_can_view_campaign_assets(uuid) from public;
revoke execute on function public.assignment_payout_model(uuid) from public;
revoke execute on function public.current_creator_account_id() from public;
