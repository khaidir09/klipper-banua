-- Phase 11 (v3.0): the client portal role (PRD M14).
--
-- A new enum value cannot be used in the transaction that adds it, so this
-- migration does nothing else; everything that reads or writes 'client'
-- lives in 20260928000100_client_portal_access.sql.

alter type public.user_role add value 'client';
