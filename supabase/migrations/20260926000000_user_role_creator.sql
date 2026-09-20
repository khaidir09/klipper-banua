-- Phase 9 (v2.0): the creator portal role (PRD M13).
--
-- A new enum value cannot be used in the transaction that adds it, so this
-- migration does nothing else; everything that reads or writes 'creator'
-- lives in 20260926000100_creator_portal_access.sql.

alter type public.user_role add value 'creator';
