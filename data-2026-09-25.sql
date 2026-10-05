SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict WUQa3CLEAOuDgXh7rZauTC5ne6y9FtQgVuPL1kedZMAMWUY1DlQnqRN9jpZAa7d

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('41274d1e-c9c3-4f0e-a084-00b0fdc325b3', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '1a825e8c-7055-47c8-ba76-a20d570c0300', 's256', 'ZwJYGUmuRLuKJNIsmxqHqSBQyCkJxDtl6arTrA-3nUw', 'recovery', '', '', '2026-09-18 15:59:16.524961+00', '2026-09-18 15:59:16.524961+00', 'recovery', NULL, NULL, NULL, NULL, NULL, false),
	('0edc03f3-4dae-4add-a49c-0a0a77adc1cc', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'b7b3bb3d-9420-409a-a078-bb25b9d4507c', 's256', 'eWnUIHhwIaPiOixfr_qhlMqLAiHCi2YqUkcGNyECFTc', 'email', '', '', '2026-09-23 15:28:04.578948+00', '2026-09-23 15:28:04.578948+00', 'email/signup', NULL, NULL, NULL, NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'authenticated', 'authenticated', 'dewakreatif22@gmail.com', '$2a$10$klDtYo/IXlV31ZDRJ12K2uVHi6p5IjKhQD0iOIfa.FkVDMBe7YfjO', '2026-09-23 15:28:25.389604+00', NULL, '', '2026-09-23 15:28:04.590052+00', '', NULL, '', '', NULL, '2026-09-24 15:14:18.707142+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "929bdd13-08e7-40a3-a05d-1e5f4356fee1", "city": "Hulu Sungai Utara", "email": "dewakreatif22@gmail.com", "signup": "mandiri", "phone_wa": "6281938960028", "province": "Kalimantan Selatan", "full_name": "Muhammad Khaidir", "birth_date": "1995-03-09", "stage_name": "khaedir09", "terms_version": "2026-10", "email_verified": true, "phone_verified": false}', NULL, '2026-09-23 15:28:04.525057+00', '2026-09-24 15:14:18.726881+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'authenticated', 'authenticated', 'khaedir09star@gmail.com', '$2a$10$vpvIZfgZgACdgcvKoFT8f.VLrC4CWdmhueaOauqiTbME6k58InjKm', '2026-09-18 15:02:07.118118+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-09-23 15:30:18.343181+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-09-18 15:02:07.100089+00', '2026-09-24 16:02:58.582748+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'd102a16d-6d92-4479-9838-66e6aea3eaf4', 'authenticated', 'authenticated', 'reno@ggmail.com', '$2a$10$FPmHzXE9G9p3Pap3XGjPYuGblc79X2sFm0.m1/CWOaPpE/4YmVdSe', '2026-09-20 13:11:43.094905+00', '2026-09-20 13:09:49.868162+00', '', NULL, '', NULL, '', '', NULL, '2026-09-23 08:56:57.447871+00', '{"provider": "email", "providers": ["email"]}', '{"role": "client", "full_name": "Reno", "email_verified": true}', NULL, '2026-09-20 13:09:49.838001+00', '2026-09-23 08:56:57.460306+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'authenticated', 'authenticated', 'desyratnasari3018@gmail.com', '$2a$10$CQlMrz6SXlswLyKv/p9vp.dYqAH9wTNB.PmMENa9iV0VgnTigi5gC', '2026-09-18 15:57:25.704874+00', '2026-09-18 15:56:58.660029+00', '', NULL, '', NULL, '', '', NULL, '2026-09-20 07:33:10.136009+00', '{"provider": "email", "providers": ["email"]}', '{"role": "manager", "full_name": "Desy Ratna Sari", "email_verified": true}', NULL, '2026-09-18 15:56:58.635936+00', '2026-09-20 07:33:10.154928+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'authenticated', 'authenticated', 'muhammad9321@guru.smk.belajar.id', '$2a$10$KIJC5RK/7X9EjSm7OOP7QeL6I.SKmJoDk7SuF2dUlOQz4EOv5G30.', '2026-09-20 04:08:41.683383+00', '2026-09-20 04:08:24.029613+00', '', NULL, '', NULL, '', '', NULL, '2026-09-23 10:16:41.842088+00', '{"provider": "email", "providers": ["email"]}', '{"role": "creator", "full_name": "", "email_verified": true}', NULL, '2026-09-20 04:08:23.984226+00', '2026-09-23 10:16:41.844538+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '{"sub": "c5c0769f-c00f-4a61-9b6d-e676a982d52c", "email": "khaedir09star@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-09-18 15:02:07.111772+00', '2026-09-18 15:02:07.111821+00', '2026-09-18 15:02:07.111821+00', 'adb4da26-e6e1-4195-bfc6-9f3313bdbe5a'),
	('c7f2ed68-4369-47d5-ad79-5d40651058fc', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '{"sub": "c7f2ed68-4369-47d5-ad79-5d40651058fc", "email": "desyratnasari3018@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-09-18 15:56:58.653662+00', '2026-09-18 15:56:58.653738+00', '2026-09-18 15:56:58.653738+00', 'f73d5b72-7a65-4b0d-b8c1-b89471f8338f'),
	('44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '{"sub": "44afb6e8-a83e-477a-a730-b78cb7d6dcf4", "email": "muhammad9321@guru.smk.belajar.id", "email_verified": true, "phone_verified": false}', 'email', '2026-09-20 04:08:24.021729+00', '2026-09-20 04:08:24.022238+00', '2026-09-20 04:08:24.022238+00', 'a6bcc65e-64dd-4715-b923-6d305d524d4f'),
	('d102a16d-6d92-4479-9838-66e6aea3eaf4', 'd102a16d-6d92-4479-9838-66e6aea3eaf4', '{"sub": "d102a16d-6d92-4479-9838-66e6aea3eaf4", "email": "reno@ggmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-09-20 13:09:49.862972+00', '2026-09-20 13:09:49.863026+00', '2026-09-20 13:09:49.863026+00', 'fbc2d9ad-c5c3-4d75-92fd-7d2e52ddb1e9'),
	('929bdd13-08e7-40a3-a05d-1e5f4356fee1', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '{"sub": "929bdd13-08e7-40a3-a05d-1e5f4356fee1", "city": "Hulu Sungai Utara", "email": "dewakreatif22@gmail.com", "signup": "mandiri", "phone_wa": "6281938960028", "province": "Kalimantan Selatan", "full_name": "Muhammad Khaidir", "birth_date": "1995-03-09", "stage_name": "khaedir09", "terms_version": "2026-10", "email_verified": true, "phone_verified": false}', 'email', '2026-09-23 15:28:04.573631+00', '2026-09-23 15:28:04.573689+00', '2026-09-23 15:28:04.573689+00', '3380520a-95c4-4d8f-b6e8-cac84d45b1ae');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('13750c17-508f-4060-9b4f-a902176bc9ec', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '2026-09-23 10:16:41.842183+00', '2026-09-23 10:16:41.842183+00', NULL, 'aal1', NULL, NULL, 'node', '34.101.123.117', NULL, NULL, NULL, NULL, NULL),
	('178e51f1-6d7c-448a-88fb-403ca805b9c8', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-23 15:30:18.346181+00', '2026-09-24 16:02:58.602243+00', NULL, 'aal1', NULL, '2026-09-24 16:02:58.60215', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36', '39.194.3.9', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('13750c17-508f-4060-9b4f-a902176bc9ec', '2026-09-23 10:16:41.844929+00', '2026-09-23 10:16:41.844929+00', 'password', '826e95d2-b6d7-48fe-b01f-b90089d550a7'),
	('178e51f1-6d7c-448a-88fb-403ca805b9c8', '2026-09-23 15:30:18.365739+00', '2026-09-23 15:30:18.365739+00', 'password', 'e54732f4-b467-4027-bade-e0d905fb2abc');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 43, '3orheim4xslp', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 04:28:55.714866+00', '2026-09-24 07:09:12.031834+00', '75qgihjqbfib', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 45, '5j7ehccqxcib', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 07:09:12.044543+00', '2026-09-24 08:21:08.962244+00', '3orheim4xslp', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 47, 'uizmx3e5oefw', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 08:21:08.985498+00', '2026-09-24 09:24:11.518448+00', '5j7ehccqxcib', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 48, 'svy4wqizfkx5', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 09:24:11.532478+00', '2026-09-24 10:24:25.204598+00', 'uizmx3e5oefw', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 50, 'oxbwv4au7cvw', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 10:24:25.218124+00', '2026-09-24 13:41:47.46331+00', 'svy4wqizfkx5', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 52, 'wjmzqh5jtdga', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 13:41:47.478848+00', '2026-09-24 15:04:19.707717+00', 'oxbwv4au7cvw', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 54, 'wamv4ollnrcw', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-24 15:04:19.733982+00', '2026-09-24 16:02:58.55466+00', 'wjmzqh5jtdga', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 57, 'wduljkchh4co', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', false, '2026-09-24 16:02:58.572601+00', '2026-09-24 16:02:58.572601+00', 'wamv4ollnrcw', '178e51f1-6d7c-448a-88fb-403ca805b9c8'),
	('00000000-0000-0000-0000-000000000000', 36, 'n7aqr5a2rjj3', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', false, '2026-09-23 10:16:41.843642+00', '2026-09-23 10:16:41.843642+00', NULL, '13750c17-508f-4060-9b4f-a902176bc9ec'),
	('00000000-0000-0000-0000-000000000000', 42, '75qgihjqbfib', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', true, '2026-09-23 15:30:18.360473+00', '2026-09-24 04:28:55.699934+00', NULL, '178e51f1-6d7c-448a-88fb-403ca805b9c8');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "full_name", "role", "is_active", "timezone", "created_at", "updated_at", "email") VALUES
	('c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'Muhammad Khaidir', 'owner', true, 'Asia/Makassar', '2026-09-18 15:02:07.098656+00', '2026-09-18 15:04:34.150042+00', 'khaedir09star@gmail.com'),
	('c7f2ed68-4369-47d5-ad79-5d40651058fc', 'Desy Ratna Sari', 'manager', true, 'Asia/Makassar', '2026-09-18 15:56:58.634302+00', '2026-09-18 15:56:58.634302+00', 'desyratnasari3018@gmail.com'),
	('44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'Desy Ratna Sari', 'creator', true, 'Asia/Makassar', '2026-09-20 04:08:23.979624+00', '2026-09-20 04:12:09.91066+00', 'muhammad9321@guru.smk.belajar.id'),
	('d102a16d-6d92-4479-9838-66e6aea3eaf4', 'Reno', 'client', true, 'Asia/Makassar', '2026-09-20 13:09:49.835368+00', '2026-09-20 13:09:49.835368+00', 'reno@ggmail.com'),
	('929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'Muhammad Khaidir', 'creator', true, 'Asia/Makassar', '2026-09-23 15:28:04.522508+00', '2026-09-23 15:28:04.522508+00', 'dewakreatif22@gmail.com');


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."activity_logs" ("id", "actor_id", "entity_type", "entity_id", "action", "details", "created_at") VALUES
	('0010ca9b-2a40-4aff-a668-e2e4fdeaa72a', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'profile', 'd81da3d1-b2d7-423b-9292-92678739a77f', 'invite', '{"role": "manager", "email": "desyratnasari3018@gmail.com"}', '2026-09-18 15:33:54.578033+00'),
	('55b47e72-fa73-4c51-9b89-378fb534e3eb', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'profile', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'invite', '{"role": "manager", "email": "desyratnasari3018@gmail.com"}', '2026-09-18 15:57:02.274258+00'),
	('a72c11ee-dc7e-44af-8ccc-cc09b546bd1e', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'creator', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'create', '{"full_name": "Desy"}', '2026-09-18 16:01:12.432797+00'),
	('7fe52ad4-6090-4464-be03-7bac17dbeaf8', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'creator_social_account', 'f1cd8077-ef6a-4b8f-a6df-a8f10e99ffe4', 'create', '{"handle": "khaedir09", "platform": "instagram", "creator_id": "9964a1ee-8adf-480e-acf2-1ee82ee0965b", "proof_uploaded": true}', '2026-09-18 16:03:37.616062+00'),
	('38bbda76-739c-4156-b5bb-a999de2ff2ba', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'creator', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'terms_recorded', '{"agreed_on": "2026-09-19", "terms_version": "v1-09-2026"}', '2026-09-18 16:05:06.779041+00'),
	('0f27d446-9113-42f5-a5e7-16ff2b338cf2', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'creator', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'verify', '{"previous_status": "prospek"}', '2026-09-18 16:05:16.745037+00'),
	('e0f29683-329c-41a3-9edb-6d214abea0a0', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client', '63a0c8e5-9aa4-4df0-85de-64776acec7ba', 'create', '{"name": "STIA Amuntai"}', '2026-09-19 06:37:35.19634+00'),
	('10a87f8d-f148-4c56-8f93-b66cde2cd360', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client_contact', NULL, 'create', '{"name": "Reno", "client_id": "63a0c8e5-9aa4-4df0-85de-64776acec7ba"}', '2026-09-19 06:38:09.795182+00'),
	('3f09682c-8c5a-419c-8c53-b81bbf04e207', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'create', '{"code": "BNG-123", "name": "PMB STIA 2027"}', '2026-09-19 06:41:15.410021+00'),
	('44e5ecbb-0519-4e43-8586-7d00ff08b89b', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_asset', '27f9db87-7fd9-4dfc-b8a1-f00b85669cfb', 'create', '{"title": "PKL", "uploaded": true, "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc"}', '2026-09-19 06:42:34.080607+00'),
	('73131f8e-fec1-4913-8c3a-29377cb157a9', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_creator', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', 'create', '{"creator": "Pinny", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "referral_code": "GMWRYS", "tracking_slug": "pinny-8ujy"}', '2026-09-19 06:43:20.529634+00'),
	('220db4e8-c7a1-4b8e-ba80-c14739964391', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'status_change', '{"to": "aktif", "from": "draft"}', '2026-09-19 06:45:35.888729+00'),
	('37ed3eeb-c8e2-4f09-9669-0130901174b6', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_creator', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', 'update', '{"status": "bergabung", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "referral_code_changed": false, "tracking_slug_changed": false}', '2026-09-19 06:47:33.958033+00'),
	('67ef6b7c-7f70-4aa6-94be-77e8722e6c1c', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'content', 'cc848284-a9dd-402e-8c8f-83b8681c9f1f', 'create', '{"platform": "tiktok", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc"}', '2026-09-19 06:57:00.600152+00'),
	('84d3cac4-8581-42bc-ad0d-bf32f7cb6de5', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'content', 'cc848284-a9dd-402e-8c8f-83b8681c9f1f', 'review', '{"decision": "disetujui", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "revision_count": 0}', '2026-09-19 06:57:31.400727+00'),
	('a9f57108-b2f4-456c-abf1-fe1743ca0579', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'content', 'cc848284-a9dd-402e-8c8f-83b8681c9f1f', 'posted', '{"posted_at": "2026-09-19T07:23:00.000Z", "posted_url": "https://www.tiktok.com/@atqiyas.room/video/7675697981848390933", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc"}', '2026-09-19 07:24:00.640324+00'),
	('4f9e973c-78f1-4fe4-bc7f-a9974103ab65', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'metric_snapshot', 'cebb8fe7-5fe2-4087-844d-2c698cf37c75', 'create', '{"views": 1100, "checkpoint": "H+1", "content_id": "cc848284-a9dd-402e-8c8f-83b8681c9f1f", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "views_warning": false}', '2026-09-19 07:26:36.28014+00'),
	('b34e1af1-9209-4b96-b61d-c8609f0a63b4', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client_payment', 'b00d0424-a47f-4a7b-b48e-1713192af9a4', 'create', '{"amount": 60000, "due_date": "2026-09-20", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "invoice_number": "INV-STIA-01"}', '2026-09-19 07:29:17.306524+00'),
	('05df03f7-1abe-4b1c-bdde-68c688a41bf9', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client_payment', 'b00d0424-a47f-4a7b-b48e-1713192af9a4', 'payment_recorded', '{"to": 60000, "from": 0, "paid_at": "2026-09-20", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "proof_attached": true}', '2026-09-19 07:29:45.012605+00'),
	('83d88244-04eb-4c19-9e40-1f81d03c1fba', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'creator_bank_account', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'bank_account_viewed', '{"exists": false, "creator_id": "9964a1ee-8adf-480e-acf2-1ee82ee0965b"}', '2026-09-19 07:30:20.68533+00'),
	('eed9ff50-2e53-450a-9bcf-a32344b86aac', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'creator_bank_account', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'update', '{"bank_name": "Bank Kalsel", "creator_id": "9964a1ee-8adf-480e-acf2-1ee82ee0965b"}', '2026-09-19 07:30:41.458627+00'),
	('e8a72347-db4d-4692-80d5-ead006b5a33a', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'registrant_report', '270f7007-b4a1-4adc-8840-70527e02897f', 'create', '{"period": "2026-09-19..2026-09-30", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "registrant_count": 12, "campaign_creator_id": "59578c1c-46a2-43c3-986c-ac38bb0d7e09"}', '2026-09-19 07:32:31.890559+00'),
	('0ed2245a-9687-4d8d-937c-edb715aa807c', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'client_payment', 'b00d0424-a47f-4a7b-b48e-1713192af9a4', 'payment_recorded', '{"to": 60000, "from": 60000, "paid_at": "2026-09-20", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "proof_attached": false}', '2026-09-19 07:34:59.540932+00'),
	('5e7f8e0d-f170-4a5b-a2c3-114534a727ad', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'campaign', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'status_change', '{"to": "selesai", "from": "aktif"}', '2026-09-19 07:35:24.057921+00'),
	('3f6c90ea-eda1-41d9-9c54-cab53de9d540', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'payout', '9b379c1f-cd34-44fa-bb09-c1f831beb0bb', 'calculate', '{"creator": "Pinny", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "recalculated": false, "total_amount": 50000}', '2026-09-19 07:35:53.779764+00'),
	('049e773a-ed72-47b2-9198-23c78caddacf', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'creator', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'terms_recorded', '{"agreed_on": "2026-09-19", "terms_version": "v2-09-2026"}', '2026-09-19 07:37:26.401754+00'),
	('909091f7-ef84-43b7-8a87-a064442b858f', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'payout', '9b379c1f-cd34-44fa-bb09-c1f831beb0bb', 'calculate', '{"creator": "Pinny", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "recalculated": true, "total_amount": 50000}', '2026-09-19 07:38:08.130959+00'),
	('f4387166-a28a-4dda-9c59-3f1bed22b483', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'share_link_create', '{"code": "BNG-123", "link_id": "e61cead7-9ee1-4ee4-8c6c-19d16c701ff8", "replaced": false, "expires_at": "2026-09-26T16:00:00.000Z"}', '2026-09-19 11:09:56.565627+00'),
	('1f845f78-4ddb-401a-b431-f87b692d2bee', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'creator', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'portal_invite', '{"email": "muhammad9321@guru.smk.belajar.id", "resent": false}', '2026-09-20 04:08:27.119166+00'),
	('764b9830-bfbb-4815-8f81-1afb831dae60', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'profile', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'update', '{"fields": ["full_name", "timezone"]}', '2026-09-20 04:12:10.009312+00'),
	('9877ca13-dde9-4160-942c-3c39171499c6', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac', 'create', '{"code": "PMB-STIA-02", "name": "PMB 2028"}', '2026-09-20 04:17:55.965352+00'),
	('55a3afc7-c7aa-44bf-9bf0-e5cf15b51cf4', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_creator', '063cb9e1-d983-49c1-a6f5-7adba5b0c9d7', 'create', '{"creator": "Pinny", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "referral_code": "Y2ZVJ6", "tracking_slug": "pinny-ztg8"}', '2026-09-20 04:18:43.501722+00'),
	('ff00504b-d8a8-4a86-9c5e-c349cacbfaf2', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac', 'status_change', '{"to": "aktif", "from": "draft"}', '2026-09-20 04:18:48.193012+00'),
	('684a7626-bae2-43e7-90a6-605f69389317', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_creator', '063cb9e1-d983-49c1-a6f5-7adba5b0c9d7', 'update', '{"status": "bergabung", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "referral_code_changed": false, "tracking_slug_changed": false}', '2026-09-20 04:36:05.532108+00'),
	('a882f3e5-b543-4595-bd49-d47e5801ed47', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'content', NULL, 'submit_draft', '{"platform": "instagram", "assignment_id": "063cb9e1-d983-49c1-a6f5-7adba5b0c9d7"}', '2026-09-20 07:32:38.832563+00'),
	('47a25c9c-6ed7-4acc-ab7c-ad4f079c5d16', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'content', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'review', '{"decision": "disetujui", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "revision_count": 0}', '2026-09-20 07:33:28.952367+00'),
	('1eda2e34-7cde-4c64-841b-643ff272c0d4', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'content', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'propose_posted', '{"url": "https://www.instagram.com/reel/DZ7HP_9zjjw/?utm_source=ig_web_button_share_sheet&stkn=MzRlODBiNWFlZA=="}', '2026-09-20 07:35:38.659731+00'),
	('560e14fb-a212-4713-bdad-28182b789d84', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'content', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'posted', '{"posted_at": "2026-09-20T07:35:00+00:00", "posted_url": "https://www.instagram.com/reel/DZ7HP_9zjjw/?utm_source=ig_web_button_share_sheet&stkn=MzRlODBiNWFlZA==", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "from_creator": true}', '2026-09-20 07:37:03.339027+00'),
	('fbd76c4c-13b8-4400-b319-1b6e6f729642', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'metric_submission', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'submit_metric', '{"views": 2000, "checkpoint": "H+1"}', '2026-09-20 07:37:47.566262+00'),
	('66058ce3-0ce9-4a7d-9406-6e1aa0c2fa9d', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'metric_submission', 'f5c2d081-3ff6-486b-a2f9-3b8a6e93e3d4', 'verify_submission', '{"accepted": true, "checkpoint": "H+1", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac"}', '2026-09-20 07:38:00.207548+00'),
	('a8aa130d-9179-48dc-860b-2feb15834630', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'metric_submission', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'submit_metric', '{"views": 5000, "checkpoint": "akhir"}', '2026-09-20 07:42:32.184728+00'),
	('7c51eeb2-a509-4bc3-915c-ac1f41cf338b', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'metric_submission', 'f57244a2-f961-4cbd-91c4-2b5181a4ef25', 'verify_submission', '{"accepted": true, "checkpoint": "akhir", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac"}', '2026-09-20 07:42:47.743203+00'),
	('c2f30011-53f9-4fbf-a009-5781bd7e1180', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac', 'status_change', '{"to": "selesai", "from": "aktif"}', '2026-09-20 07:43:05.679065+00'),
	('00dc1676-3ed4-4956-a546-5bee666b4d42', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'payout', 'fb02c478-3530-4128-a1b9-eaaeee992112', 'calculate', '{"creator": "Pinny", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "recalculated": false, "total_amount": 500000}', '2026-09-20 07:43:39.111984+00'),
	('8b27ed3a-2021-4410-9e52-f17e16621bce', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'payout', 'fb02c478-3530-4128-a1b9-eaaeee992112', 'approve', '{"campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "total_amount": 500000}', '2026-09-20 07:43:50.326891+00'),
	('5a268375-a8d5-4932-85c9-bab24dc56a4f', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'payout', 'fb02c478-3530-4128-a1b9-eaaeee992112', 'paid', '{"paid_at": "2026-09-20", "campaign_id": "8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac", "total_amount": 500000}', '2026-09-20 07:44:18.659709+00'),
	('82cfc397-7166-4f88-b8a6-35b2ad18421d', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client_contact', '4d253480-7441-42a7-9969-14e18ffb1fff', 'portal_invite', '{"email": "reno@ggmail.com", "resent": false, "client_id": "63a0c8e5-9aa4-4df0-85de-64776acec7ba"}', '2026-09-20 13:09:53.862119+00'),
	('3f21204e-8d6e-49ae-a548-4b6eac394345', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client_contact', '4d253480-7441-42a7-9969-14e18ffb1fff', 'update', '{"name": "Reno", "client_id": "63a0c8e5-9aa4-4df0-85de-64776acec7ba"}', '2026-09-20 13:10:22.774759+00'),
	('99f55ed5-ed37-4e85-a144-e886c4095932', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'client_contact', '4d253480-7441-42a7-9969-14e18ffb1fff', 'portal_invite', '{"email": "dewakreatif22@gmail.com", "resent": true, "client_id": "63a0c8e5-9aa4-4df0-85de-64776acec7ba"}', '2026-09-20 13:10:26.047832+00'),
	('d88d31d1-a9bc-4bdb-af60-bf74c1682102', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'creator_bank_account', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'bank_account_viewed', '{"exists": true, "creator_id": "9964a1ee-8adf-480e-acf2-1ee82ee0965b"}', '2026-09-23 08:51:21.799492+00'),
	('cee32b40-12f3-4b53-a7b8-02d6e1461682', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'b6fafbfb-b611-4f25-9b08-520ea5d528b4', 'create', '{"code": "DEMO-PORTAL-2026", "name": "Open House Universitas Demo Borneo"}', '2026-09-23 09:03:34.442464+00'),
	('244c3a13-282a-4e06-897c-fa11ac1ba93e', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_asset', '715da471-49db-43a8-a96b-329ffd4bc3fe', 'create', '{"title": "Panduan open house", "uploaded": false, "campaign_id": "b6fafbfb-b611-4f25-9b08-520ea5d528b4"}', '2026-09-23 09:04:08.371508+00'),
	('eb636cb5-e493-4d41-8890-d02d37840227', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_creator', 'a2a33a4b-dfd3-4544-bcd3-40ff1a3322d3', 'create', '{"creator": "Pinny", "campaign_id": "b6fafbfb-b611-4f25-9b08-520ea5d528b4", "referral_code": "U6CN59", "tracking_slug": "pinny-nrgr"}', '2026-09-23 10:15:50.644597+00'),
	('09cab5c7-9809-4b94-b171-f71e729655a8', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'b6fafbfb-b611-4f25-9b08-520ea5d528b4', 'status_change', '{"to": "aktif", "from": "draft"}', '2026-09-23 10:17:00.030579+00'),
	('72cd29d2-70a2-4b6b-8df5-f749ec9c4c33', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'campaign_creator', 'a2a33a4b-dfd3-4544-bcd3-40ff1a3322d3', 'confirm_assignment', '{"campaign_id": "b6fafbfb-b611-4f25-9b08-520ea5d528b4", "from_portal": true}', '2026-09-23 10:18:03.931185+00'),
	('2c754022-e552-40a1-9bd5-58f2fa275357', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'content', 'cc848284-a9dd-402e-8c8f-83b8681c9f1f', 'removed', '{"removed_at": "2026-09-23T15:24:00.000Z", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc"}', '2026-09-23 15:24:16.352885+00'),
	('e0e715ed-26fd-4e0f-a100-735548d1f6ee', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'registrant_report', '270f7007-b4a1-4adc-8840-70527e02897f', 'delete', '{"campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc", "registrant_count": 12}', '2026-09-23 15:24:36.918898+00'),
	('5baee7f3-36bf-43d6-9532-9b25f7f39b28', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'metric_snapshot', 'cebb8fe7-5fe2-4087-844d-2c698cf37c75', 'delete', '{"views": 1100, "checkpoint": "H+1", "content_id": "cc848284-a9dd-402e-8c8f-83b8681c9f1f", "campaign_id": "d94f2781-fb56-4c6e-ad9d-20acb69585fc"}', '2026-09-23 15:24:39.856201+00'),
	('bcc56b22-7509-4c68-91d1-6a521790f49a', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'b6fafbfb-b611-4f25-9b08-520ea5d528b4', 'status_change', '{"to": "dibatalkan", "from": "aktif"}', '2026-09-23 15:24:58.612582+00'),
	('717f235a-418c-4b38-8561-9f2e35958dbd', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'b6fafbfb-b611-4f25-9b08-520ea5d528b4', 'delete', '{"code": "DEMO-PORTAL-2026"}', '2026-09-23 15:25:03.902291+00'),
	('bb9010fd-722d-49a1-80e9-0cc930e0a100', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'creator', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'block', '{"reason": "HAPUS"}', '2026-09-23 15:26:22.206189+00'),
	('9d15ef25-9fc5-4883-9b7d-622a341685c2', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'creator', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'self_signup', '{"terms_version": "2026-10"}', '2026-09-23 15:28:04.522508+00'),
	('6a31e65d-1013-4326-9fcf-90c37132f020', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'creator_social_account', 'b1eded56-a7d6-44e2-ae1a-0f3bc4d7b869', 'create', '{"handle": "guruberdigital", "source": "portal", "platform": "tiktok", "creator_id": "631b2e0f-8c95-4f95-951c-3b81c7d110df"}', '2026-09-23 15:29:08.30807+00'),
	('3e730dd9-5f3c-4a86-a89d-25ba5c06dc84', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'creator_bank_account', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'create', '{"last4": "0028", "bank_name": "DANA", "from_portal": true, "holder_matches_name": true}', '2026-09-24 04:30:19.174434+00'),
	('1ec31928-5c8f-4eba-b692-6f2431b5f3d3', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163', 'create', '{"code": "DEMO-PORTAL-2028", "name": "Abcde", "access": "terbuka"}', '2026-09-24 07:11:34.219136+00'),
	('0e406e5d-42c2-458e-bc15-3cfb327acb6c', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign_asset', '1fd24c71-66c9-4fca-94b4-c1bb04a3202d', 'create', '{"title": "Logo", "uploaded": true, "campaign_id": "cb3b6220-2ad7-46cf-99c8-15642a5ee163"}', '2026-09-24 07:12:10.832183+00'),
	('bc3fb1ed-d23a-4205-b595-8e4a382896f0', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'campaign', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163', 'status_change', '{"to": "aktif", "from": "draft"}', '2026-09-24 07:12:29.5558+00'),
	('c4dabd7b-ec49-4a72-950e-ea166f13a17d', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'campaign_creator', '46e18ce0-7fa6-418d-ba1e-1b0dbbcf965a', 'join_campaign', '{"campaign_id": "cb3b6220-2ad7-46cf-99c8-15642a5ee163", "from_portal": true}', '2026-09-24 07:14:23.985165+00'),
	('7263d15c-6f3e-4c32-acbe-8dd0c5a0e4dd', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'content', '863f4c90-5ecc-4cfc-9114-bfc9a35aa882', 'submit_clip', '{"url": "https://www.tiktok.com/@guruberdigital/video/7464571378138696966?is_from_webapp=1&sender_device=pc", "views": 80300, "platform": "tiktok", "campaign_id": "cb3b6220-2ad7-46cf-99c8-15642a5ee163"}', '2026-09-24 13:47:28.727297+00'),
	('b5e7bf12-d943-4ce2-920d-eb7a8ba8356d', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'creator_ledger_entry', 'ad664a4d-889e-4845-8458-11712cd4e15a', 'ledger_credit', '{"amount": 803000, "content_id": "863f4c90-5ecc-4cfc-9114-bfc9a35aa882", "creator_id": "631b2e0f-8c95-4f95-951c-3b81c7d110df", "campaign_id": "cb3b6220-2ad7-46cf-99c8-15642a5ee163", "verified_views": 80300}', '2026-09-24 13:48:39.861509+00'),
	('39d37198-ca2c-4e91-826d-4857ce3c2787', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'content', '863f4c90-5ecc-4cfc-9114-bfc9a35aa882', 'verify_clip', '{"credit": 803000, "decision": "disetujui", "campaign_id": "cb3b6220-2ad7-46cf-99c8-15642a5ee163", "verified_views": 80300}', '2026-09-24 13:48:39.928964+00'),
	('c6bd18ec-454c-46bb-a703-2ccd22fd7e9a', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'withdrawal', '15972cec-7a38-4241-a4ff-b63aaf3761b2', 'withdrawal_request', '{"amount": 803000, "creator_id": "631b2e0f-8c95-4f95-951c-3b81c7d110df", "balance_before": 803000}', '2026-09-24 13:51:40.827613+00'),
	('8421f6f2-7f45-446d-8d6a-7042d63dad35', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'withdrawal', '15972cec-7a38-4241-a4ff-b63aaf3761b2', 'withdrawal_request', '{"amount": 803000, "from_portal": true}', '2026-09-24 13:51:40.890377+00'),
	('19bba00f-1156-42d9-aaab-7df7463a4a01', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'withdrawal', NULL, 'bank_account_viewed', '{"page": "penarikan", "rows": 1, "status": "semua"}', '2026-09-24 13:51:50.693204+00'),
	('59280351-b58b-408f-859a-7b25d8260472', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'withdrawal', NULL, 'bank_account_viewed', '{"page": "penarikan", "rows": 1, "status": "diajukan"}', '2026-09-24 13:51:54.023813+00'),
	('02b1f186-0b78-42ae-9e78-83faa6c09852', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'withdrawal', '15972cec-7a38-4241-a4ff-b63aaf3761b2', 'withdrawal_diproses', '{"amount": 803000, "reason": null, "paid_at": null, "creator_id": "631b2e0f-8c95-4f95-951c-3b81c7d110df", "transfer_fee": null}', '2026-09-24 13:52:00.605272+00'),
	('4d823b22-f14d-44ed-8f73-3020d2a72fae', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'withdrawal', NULL, 'bank_account_viewed', '{"page": "penarikan", "rows": 1, "status": "diproses"}', '2026-09-24 13:52:04.090712+00'),
	('d5156aab-0b24-4e28-bd20-185c4226756b', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'withdrawal', '15972cec-7a38-4241-a4ff-b63aaf3761b2', 'withdrawal_dibayar', '{"amount": 803000, "reason": null, "paid_at": "2026-09-24", "creator_id": "631b2e0f-8c95-4f95-951c-3b81c7d110df", "transfer_fee": 2500}', '2026-09-24 13:52:35.245777+00'),
	('1ee941b3-3b26-4897-9eab-b1436a9ed7b0', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'withdrawal', NULL, 'bank_account_viewed', '{"page": "penarikan", "rows": 1, "status": "dibayar"}', '2026-09-24 13:52:40.30323+00');


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."clients" ("id", "name", "type", "city", "province", "address", "notes", "created_by", "created_at", "updated_at") VALUES
	('63a0c8e5-9aa4-4df0-85de-64776acec7ba', 'STIA Amuntai', 'instansi', 'Hulu Sungai Utara', 'Kalimantan Selatan', 'Sungai Karias', '', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:37:35.082934+00', '2026-09-19 06:37:35.082934+00');


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."campaigns" ("id", "client_id", "code", "name", "objective", "brief", "must_do", "must_not", "hashtags", "paid_label_required", "landing_url", "start_date", "end_date", "min_live_days", "status", "package_price", "target_contents", "target_views", "target_registrants", "default_base_fee", "default_bonus_per_1000_views", "default_bonus_per_registrant", "default_views_bonus_cap", "closing_notes", "created_by", "created_at", "updated_at", "access", "payout_model", "rate_per_1000_views", "creator_budget", "max_payout_per_clip", "max_payout_per_creator", "min_views_to_earn", "max_clips_per_creator", "allowed_platforms", "local_only", "claim_grace_days", "published_at") VALUES
	('d94f2781-fb56-4c6e-ad9d-20acb69585fc', '63a0c8e5-9aa4-4df0-85de-64776acec7ba', 'BNG-123', 'PMB STIA 2027', 'pendaftar', 'Abc', '{A,B,C}', '{A,B,C}', '{#PMBSTIA,#KuliahAdministrasi}', true, 'https://www.stiaamuntai.ac.id/', '2026-09-19', '2026-09-30', 30, 'selesai', 5000000, 10, 10000, 5, 0, 50000, 0, NULL, '', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:41:15.26532+00', '2026-09-19 07:35:23.921868+00', 'undangan', 'paket', 0, 0, NULL, NULL, 0, 3, '{}', false, 3, NULL),
	('8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac', '63a0c8e5-9aa4-4df0-85de-64776acec7ba', 'PMB-STIA-02', 'PMB 2028', 'awareness', 'Abc', '{A,B,C}', '{A,B,C}', '{#2028}', true, 'https://stiperamuntai.ac.id/', '2026-09-20', '2026-09-30', 30, 'selesai', 2000000, 10, 10000, 0, 0, 100000, 0, NULL, '', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 04:17:55.775945+00', '2026-09-20 07:43:05.583687+00', 'undangan', 'paket', 0, 0, NULL, NULL, 0, 3, '{}', false, 3, NULL),
	('cb3b6220-2ad7-46cf-99c8-15642a5ee163', '63a0c8e5-9aa4-4df0-85de-64776acec7ba', 'DEMO-PORTAL-2028', 'Abcde', NULL, 'Abc', '{A,B,C}', '{A,B,C}', '{#PMBSTIA,#KuliahAdministrasi}', false, 'https://www.stiaamuntai.ac.id/', '2026-09-24', '2026-10-31', 30, 'aktif', 0, 5, 100000, 0, 0, 0, 0, NULL, '', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 07:11:34.046275+00', '2026-09-24 13:33:41.699033+00', 'terbuka', 'per_views', 10000, 1000000, NULL, NULL, 10000, 3, '{tiktok,instagram,youtube,facebook}', false, 3, '2026-09-24 07:12:29.431233+00');


--
-- Data for Name: campaign_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."campaign_assets" ("id", "campaign_id", "title", "type", "file_path", "external_url", "notes", "created_by", "created_at", "updated_at") VALUES
	('27f9db87-7fd9-4dfc-b8a1-f00b85669cfb', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'PKL', 'video', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc/e69184a2-b9c2-44ff-9107-5f3711de8b12-mvi-1497.mov', NULL, 'PKL', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:42:33.971406+00', '2026-09-19 06:42:33.971406+00'),
	('1fd24c71-66c9-4fca-94b4-c1bb04a3202d', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163', 'Logo', 'foto', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163/136391c7-b4ae-457f-b35b-63fb496d6764-profile-ig.png', NULL, 'Logo', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 07:12:10.712032+00', '2026-09-24 07:12:10.712032+00');


--
-- Data for Name: creators; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."creators" ("id", "full_name", "stage_name", "phone_wa", "email", "city", "province", "birth_date", "niches", "tier", "status", "terms_version", "terms_agreed_at", "verified_at", "verified_by", "notes", "created_by", "created_at", "updated_at", "anonymized_at", "profile_id", "portal_invited_at", "signup_source", "verification_code", "blocked_at", "blocked_reason", "deletion_requested_at") VALUES
	('9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'Desy', 'Pinny', '6281250370571', 'muhammad9321@guru.smk.belajar.id', 'Hulu Sungai Utara', 'Kalimantan Selatan', '1995-12-05', '{gaya_hidup,pendidikan}', 'nano', 'diblokir', 'v2-09-2026', '2026-09-19 00:00:00+00', '2026-09-18 16:05:16.762+00', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', 'Uji', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '2026-09-18 16:01:12.297666+00', '2026-09-23 15:26:22.080222+00', NULL, '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '2026-09-20 04:08:27.029+00', 'undangan', 'KB-C4843B', '2026-09-23 15:26:22.080222+00', 'HAPUS', NULL),
	('631b2e0f-8c95-4f95-951c-3b81c7d110df', 'Muhammad Khaidir', 'khaedir09', '6281938960028', 'dewakreatif22@gmail.com', 'Hulu Sungai Utara', 'Kalimantan Selatan', '1995-03-09', '{}', 'nano', 'aktif', '2026-10', '2026-09-23 15:28:04.522508+00', NULL, NULL, '', NULL, '2026-09-23 15:28:04.522508+00', '2026-09-23 15:29:08.206867+00', NULL, '929bdd13-08e7-40a3-a05d-1e5f4356fee1', NULL, 'mandiri', 'KB-HFPW4G', NULL, NULL, NULL);


--
-- Data for Name: campaign_creators; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."campaign_creators" ("id", "campaign_id", "creator_id", "status", "contents_committed", "base_fee", "bonus_per_1000_views", "bonus_per_registrant", "views_bonus_cap", "referral_code", "tracking_slug", "joined_at", "created_by", "created_at", "updated_at", "creator_confirmed_at", "join_source", "withdrawn_at") VALUES
	('59578c1c-46a2-43c3-986c-ac38bb0d7e09', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'bergabung', 1, NULL, NULL, NULL, NULL, 'GMWRYS', 'pinny-8ujy', '2026-09-19 06:47:33.808+00', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:43:20.383817+00', '2026-09-19 06:47:33.848189+00', NULL, 'tim', NULL),
	('063cb9e1-d983-49c1-a6f5-7adba5b0c9d7', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'bergabung', 1, NULL, NULL, NULL, NULL, 'Y2ZVJ6', 'pinny-ztg8', '2026-09-20 04:36:05.446+00', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 04:18:43.391799+00', '2026-09-20 04:36:05.43849+00', NULL, 'tim', NULL),
	('46e18ce0-7fa6-418d-ba1e-1b0dbbcf965a', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'bergabung', 3, NULL, NULL, NULL, NULL, 'P2JQF9', 'khaedir09-gdtu', '2026-09-24 07:14:23.864874+00', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '2026-09-24 07:14:23.864874+00', '2026-09-24 07:14:23.864874+00', '2026-09-24 07:14:23.864874+00', 'mandiri', NULL);


--
-- Data for Name: client_contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."client_contacts" ("id", "client_id", "name", "position", "phone_wa", "email", "is_primary", "created_at", "updated_at", "profile_id", "portal_invited_at") VALUES
	('4d253480-7441-42a7-9969-14e18ffb1fff', '63a0c8e5-9aa4-4df0-85de-64776acec7ba', 'Reno', 'Ketua', '6281234567890', 'dewakreatif22@gmail.com', true, '2026-09-19 06:38:09.724978+00', '2026-09-20 13:10:26.006049+00', 'd102a16d-6d92-4479-9838-66e6aea3eaf4', '2026-09-20 13:10:25.981+00');


--
-- Data for Name: client_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."client_payments" ("id", "campaign_id", "invoice_number", "amount", "due_date", "status", "paid_amount", "paid_at", "proof_path", "created_by", "created_at", "updated_at") VALUES
	('b00d0424-a47f-4a7b-b48e-1713192af9a4', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'INV-STIA-01', 60000, '2026-09-20', 'lunas', 60000, '2026-09-20', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc/87e2f74d-2a42-4aaf-bfb6-2248b9938247-whatsapp-image-2026-09-16-at-23-04-33.jpeg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 07:29:17.210734+00', '2026-09-19 07:34:59.43702+00');


--
-- Data for Name: contents; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."contents" ("id", "campaign_creator_id", "platform", "draft_url", "draft_file_path", "caption_draft", "review_status", "revision_count", "posted_url", "posted_at", "live_status", "removed_at", "created_by", "created_at", "updated_at", "proposed_posted_url", "proposed_posted_at", "proposed_at", "posted_url_normalized", "verified_views", "rejection_reason", "caption_code_checked") VALUES
	('3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', '063cb9e1-d983-49c1-a6f5-7adba5b0c9d7', 'instagram', 'https://drive.google.com/file/d/draf-2/view', NULL, 'Abcccccc', 'disetujui', 0, 'https://www.instagram.com/reel/DZ7HP_9zjjw/?utm_source=ig_web_button_share_sheet&stkn=MzRlODBiNWFlZA==', '2026-09-20 07:35:00+00', 'tayang', NULL, NULL, '2026-09-20 07:32:38.76113+00', '2026-09-20 07:37:03.276565+00', NULL, NULL, NULL, NULL, NULL, NULL, false),
	('cc848284-a9dd-402e-8c8f-83b8681c9f1f', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', 'tiktok', 'https://drive.google.com/file/d/draf-1/view', NULL, 'Abc', 'disetujui', 0, 'https://www.tiktok.com/@atqiyas.room/video/7675697981848390933', '2026-09-19 07:23:00+00', 'dihapus', '2026-09-23 15:24:00+00', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:57:00.529983+00', '2026-09-23 15:24:16.234012+00', NULL, NULL, NULL, NULL, NULL, NULL, false),
	('863f4c90-5ecc-4cfc-9114-bfc9a35aa882', '46e18ce0-7fa6-418d-ba1e-1b0dbbcf965a', 'tiktok', NULL, NULL, '', 'disetujui', 0, 'https://www.tiktok.com/@guruberdigital/video/7464571378138696966?is_from_webapp=1&sender_device=pc', '2026-09-24 13:45:00+00', 'tayang', NULL, '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '2026-09-24 13:47:28.618673+00', '2026-09-24 13:48:39.861509+00', 'https://www.tiktok.com/@guruberdigital/video/7464571378138696966?is_from_webapp=1&sender_device=pc', '2026-09-24 13:45:00+00', '2026-09-24 13:47:28.618673+00', 'https://tiktok.com/@guruberdigital/video/7464571378138696966', 80300, NULL, true);


--
-- Data for Name: content_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content_reviews" ("id", "content_id", "decision", "checklist", "notes", "draft_snapshot", "reviewer_id", "created_at") VALUES
	('ee50e253-2e40-4028-9b9a-b9de80853042', 'cc848284-a9dd-402e-8c8f-83b8681c9f1f', 'disetujui', '{"info_akurat": true, "sesuai_brief": true, "label_berbayar": true, "tanpa_larangan": true}', '', '{"platform": "tiktok", "draft_url": "https://drive.google.com/file/d/draf-1/view", "caption_draft": "Abc", "revision_count": 0, "draft_file_path": null}', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:57:31.275401+00'),
	('e8170d57-b00f-4454-8062-64f311467b55', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'disetujui', '{"info_akurat": true, "sesuai_brief": true, "label_berbayar": true, "tanpa_larangan": true}', '', '{"platform": "instagram", "draft_url": "https://drive.google.com/file/d/draf-2/view", "caption_draft": "Abcccccc", "revision_count": 0, "draft_file_path": null}', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '2026-09-20 07:33:28.840033+00'),
	('7c809e8c-5f45-4f71-9c0c-07d0ab1ee536', '863f4c90-5ecc-4cfc-9114-bfc9a35aa882', 'disetujui', '{"hashtag": true, "akun_sesuai": true, "views_cocok": true, "sesuai_brief": true, "dalam_periode": true, "label_berbayar": false, "tanpa_larangan": true, "kode_verifikasi": true, "tanpa_views_palsu": true}', '', '{"platform": "tiktok", "draft_url": null, "caption_draft": "", "revision_count": 0, "draft_file_path": null, "proposed_posted_at": "2026-09-24T13:45:00+00:00", "proposed_posted_url": "https://www.tiktok.com/@guruberdigital/video/7464571378138696966?is_from_webapp=1&sender_device=pc"}', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 13:48:39.861509+00');


--
-- Data for Name: creator_bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."creator_bank_accounts" ("id", "creator_id", "bank_name", "account_number", "account_holder", "created_at", "updated_at", "changed_at", "holder_matches_name") VALUES
	('51434e87-eacc-48ab-b781-56e64ed1b4aa', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'Bank Kalsel', '3203142535', 'Desy', '2026-09-19 07:30:41.349768+00', '2026-09-19 07:30:41.349768+00', NULL, true),
	('9fabaccd-993d-4819-aca2-8c46bf4d1fd7', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'DANA', '081938960028', 'Muhammad Khaidir', '2026-09-24 04:30:19.174434+00', '2026-09-24 04:30:19.174434+00', NULL, true);


--
-- Data for Name: metric_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."metric_snapshots" ("id", "content_id", "checkpoint", "captured_at", "views", "likes", "comments", "shares", "saves", "proof_path", "entered_by", "created_at", "updated_at") VALUES
	('aea8f2df-d9bb-4fd1-8ee2-0469e1952def', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'H+1', '2026-09-20 07:37:00+00', 2000, 1399, 234, 4, 5, '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/93e10055-f4e0-4984-afd0-4bad9508a72b-screenshot-2026-09-18-113024.jpg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:38:00.09689+00', '2026-09-20 07:38:00.09689+00'),
	('a3c2468f-dc5c-4d59-a983-07a5cb2fbaa5', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'akhir', '2026-09-20 07:42:00+00', 5000, 1222, 213, 35, 24, '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/29ce61b1-5cc5-43a3-a8fc-e1f450b65791-whatsapp-image-2026-09-16-at-23-04-33.jpeg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:42:47.660053+00', '2026-09-20 07:42:47.660053+00'),
	('bb9968c1-7abe-4e98-8063-4e6c8e3e8bad', '863f4c90-5ecc-4cfc-9114-bfc9a35aa882', 'lainnya', '2026-09-24 13:47:28.618673+00', 80300, 1558, 33, 144, 0, 'cb3b6220-2ad7-46cf-99c8-15642a5ee163/a5768db7-b108-436d-a919-73f6bed73508-screenshot-2026-09-24-214702.jpg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 13:48:39.861509+00', '2026-09-24 13:48:39.861509+00');


--
-- Data for Name: metric_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."metric_submissions" ("id", "content_id", "checkpoint", "captured_at", "views", "likes", "comments", "shares", "saves", "proof_path", "status", "review_notes", "submitted_by", "reviewed_by", "reviewed_at", "snapshot_id", "created_at", "updated_at", "verified_views", "credited_amount", "credit_limited") VALUES
	('f5c2d081-3ff6-486b-a2f9-3b8a6e93e3d4', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'H+1', '2026-09-20 07:37:00+00', 2000, 1399, 234, 4, 5, '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/93e10055-f4e0-4984-afd0-4bad9508a72b-screenshot-2026-09-18-113024.jpg', 'diterima', '', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:38:00.09689+00', 'aea8f2df-d9bb-4fd1-8ee2-0469e1952def', '2026-09-20 07:37:47.505993+00', '2026-09-20 07:38:00.09689+00', NULL, NULL, false),
	('f57244a2-f961-4cbd-91c4-2b5181a4ef25', '3cb5caa3-ffd2-466c-9134-0a5d7e3dec09', 'akhir', '2026-09-20 07:42:00+00', 5000, 1222, 213, 35, 24, '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/29ce61b1-5cc5-43a3-a8fc-e1f450b65791-whatsapp-image-2026-09-16-at-23-04-33.jpeg', 'diterima', '', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:42:47.660053+00', 'a3c2468f-dc5c-4d59-a983-07a5cb2fbaa5', '2026-09-20 07:42:32.101192+00', '2026-09-20 07:42:47.660053+00', NULL, NULL, false),
	('d1173b9c-e6e5-4af4-8f86-272172229fdf', '863f4c90-5ecc-4cfc-9114-bfc9a35aa882', 'lainnya', '2026-09-24 13:47:28.618673+00', 80300, 1558, 33, 144, 0, 'cb3b6220-2ad7-46cf-99c8-15642a5ee163/a5768db7-b108-436d-a919-73f6bed73508-screenshot-2026-09-24-214702.jpg', 'diterima', '', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 13:48:39.861509+00', 'bb9968c1-7abe-4e98-8063-4e6c8e3e8bad', '2026-09-24 13:47:28.618673+00', '2026-09-24 13:48:39.861509+00', 80300, 803000, false);


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."withdrawals" ("id", "creator_id", "amount", "bank_name", "account_number", "account_holder", "status", "requested_at", "processed_by", "processed_at", "paid_at", "transfer_proof_path", "transfer_fee", "rejection_reason", "created_at", "updated_at") VALUES
	('15972cec-7a38-4241-a4ff-b63aaf3761b2', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 803000, 'DANA', '081938960028', 'Muhammad Khaidir', 'dibayar', '2026-09-24 13:51:40.827613+00', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 13:52:35.245777+00', '2026-09-24', 'withdrawals/d4548521-bc34-479c-8977-042b25966da3-whatsapp-image-2026-09-24-at-13-54-23.jpeg', 2500, NULL, '2026-09-24 13:51:40.827613+00', '2026-09-24 13:52:35.245777+00');


--
-- Data for Name: creator_ledger_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."creator_ledger_entries" ("id", "creator_id", "entry_type", "amount", "campaign_id", "content_id", "metric_submission_id", "withdrawal_id", "notes", "created_by", "created_at") VALUES
	('ad664a4d-889e-4845-8458-11712cd4e15a', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'honor_klip', 803000, 'cb3b6220-2ad7-46cf-99c8-15642a5ee163', '863f4c90-5ecc-4cfc-9114-bfc9a35aa882', 'd1173b9c-e6e5-4af4-8f86-272172229fdf', NULL, '', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 13:48:39.861509+00'),
	('a1d39bbe-5613-44cb-b4ed-546f26557428', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'penarikan', -803000, NULL, NULL, NULL, '15972cec-7a38-4241-a4ff-b63aaf3761b2', '', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '2026-09-24 13:51:40.827613+00');


--
-- Data for Name: creator_social_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."creator_social_accounts" ("id", "creator_id", "platform", "handle", "profile_url", "followers_count", "kalimantan_audience_pct", "top_cities", "audience_proof_path", "last_verified_at", "created_at", "updated_at", "badge_requested_at", "badge_review_notes") VALUES
	('f1cd8077-ef6a-4b8f-a6df-a8f10e99ffe4', '9964a1ee-8adf-480e-acf2-1ee82ee0965b', 'instagram', 'khaedir09', 'https://www.instagram.com/khaedir09', 733, 60.00, 'Amuntai, Tanjung, Banjarbaru', '9964a1ee-8adf-480e-acf2-1ee82ee0965b/f1cd8077-ef6a-4b8f-a6df-a8f10e99ffe4-1789747417223.jpg', '2026-09-19 00:00:00+00', '2026-09-18 16:03:37.05251+00', '2026-09-18 16:03:37.553574+00', NULL, NULL),
	('b1eded56-a7d6-44e2-ae1a-0f3bc4d7b869', '631b2e0f-8c95-4f95-951c-3b81c7d110df', 'tiktok', 'guruberdigital', 'https://www.tiktok.com/@guruberdigital', 219, NULL, '', NULL, NULL, '2026-09-23 15:29:08.206867+00', '2026-09-23 15:29:08.206867+00', NULL, NULL);


--
-- Data for Name: link_clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."link_clicks" ("id", "campaign_creator_id", "clicked_at", "referrer", "user_agent", "ip_hash", "is_bot", "created_at") VALUES
	('2ba84f64-0a8f-49e7-b1fc-2856d38ae32f', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', '2026-09-19 06:46:32.787397+00', NULL, 'WhatsApp/2.2636.100 W', 'ea3ece7a18470d9526244523ad0403ec24107db418ca7dd6a6ea63d71fb6c252', true, '2026-09-19 06:46:32.787397+00'),
	('a379ac70-0a98-4809-9206-e6f4c984fe48', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', '2026-09-19 06:46:47.87+00', NULL, 'WhatsApp/2.2636.100 W', 'ea3ece7a18470d9526244523ad0403ec24107db418ca7dd6a6ea63d71fb6c252', true, '2026-09-19 06:46:47.87+00'),
	('885eb1ad-4e94-46cc-bea5-bf0f220fd901', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', '2026-09-19 06:47:11.673369+00', NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36', 'ea3ece7a18470d9526244523ad0403ec24107db418ca7dd6a6ea63d71fb6c252', false, '2026-09-19 06:47:11.673369+00'),
	('a6447366-fb46-4bdd-9c18-7654541e243c', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', '2026-09-19 06:47:39.660267+00', NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36', 'ea3ece7a18470d9526244523ad0403ec24107db418ca7dd6a6ea63d71fb6c252', false, '2026-09-19 06:47:39.660267+00'),
	('a48c9b5c-e81c-4f6c-a3f0-0ab505c2d9fb', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', '2026-09-19 06:48:52.63197+00', NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36', 'ea3ece7a18470d9526244523ad0403ec24107db418ca7dd6a6ea63d71fb6c252', false, '2026-09-19 06:48:52.63197+00');


--
-- Data for Name: ops_time_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ops_time_logs" ("id", "campaign_id", "user_id", "activity", "minutes", "log_date", "notes", "created_at", "updated_at") VALUES
	('844a4101-2536-41cf-9c00-5fcca864e2f5', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', 'review', 60, '2026-09-19', '', '2026-09-19 07:31:02.76677+00', '2026-09-19 07:31:02.76677+00');


--
-- Data for Name: payouts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."payouts" ("id", "campaign_creator_id", "base_amount", "views_bonus", "registrant_bonus", "adjustment_amount", "adjustment_reason", "total_amount", "calculation_snapshot", "calculated_at", "status", "approved_by", "approved_at", "paid_at", "transfer_proof_path", "created_by", "created_at", "updated_at") VALUES
	('9b379c1f-cd34-44fa-bb09-c1f831beb0bb', '59578c1c-46a2-43c3-986c-ac38bb0d7e09', 0, 50000, 0, 0, '', 50000, '{"scheme": {"base_fee": 0, "overridden": {"baseFee": false, "viewsBonusCap": false, "bonusPer1000Views": false, "bonusPerRegistrant": false}, "views_bonus_cap": null, "bonus_per_1000_views": 50000, "bonus_per_registrant": 0}, "contents": [{"id": "cc848284-a9dd-402e-8c8f-83b8681c9f1f", "views": 1100, "reason": null, "eligible": true, "counts_for_base_fee": true}], "total_views": 1100, "calculated_at": "2026-09-19T07:38:08.008Z", "min_live_days": 30, "valid_contents": 1, "views_bonus_raw": 50000, "registrant_count": 12, "eligible_contents": 1, "contents_committed": 1}', '2026-09-19 07:38:08.008+00', 'draf', NULL, NULL, NULL, NULL, 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '2026-09-19 07:35:53.722504+00', '2026-09-19 07:38:08.054375+00'),
	('fb02c478-3530-4128-a1b9-eaaeee992112', '063cb9e1-d983-49c1-a6f5-7adba5b0c9d7', 0, 500000, 0, 0, '', 500000, '{"scheme": {"base_fee": 0, "overridden": {"baseFee": false, "viewsBonusCap": false, "bonusPer1000Views": false, "bonusPerRegistrant": false}, "views_bonus_cap": null, "bonus_per_1000_views": 100000, "bonus_per_registrant": 0}, "contents": [{"id": "3cb5caa3-ffd2-466c-9134-0a5d7e3dec09", "views": 5000, "reason": null, "eligible": true, "counts_for_base_fee": true}], "total_views": 5000, "calculated_at": "2026-09-20T07:43:39.049Z", "min_live_days": 30, "valid_contents": 1, "views_bonus_raw": 500000, "registrant_count": 0, "eligible_contents": 1, "contents_committed": 1}', '2026-09-20 07:43:39.049+00', 'dibayar', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:43:50.241952+00', '2026-09-20', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/db1713e4-db89-448c-8a58-b77db13dafa4-screenshot-2026-09-18-143255.jpg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:43:39.05523+00', '2026-09-20 07:44:18.329955+00');


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."platform_settings" ("id", "min_withdrawal", "updated_by", "created_at", "updated_at") VALUES
	(true, 100000, NULL, '2026-09-24 04:12:27.763832+00', '2026-09-24 04:12:27.763832+00');


--
-- Data for Name: registrant_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: report_share_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."report_share_links" ("id", "campaign_id", "token_hash", "expires_at", "created_by", "created_at", "revoked_at", "revoked_by", "last_viewed_at", "view_count") VALUES
	('e61cead7-9ee1-4ee4-8c6c-19d16c701ff8', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc', 'da87285fec46373e4436df5e0776b0b0602da3033b412e335659d00eb3805e42', '2026-09-26 16:00:00+00', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 11:09:56.511301+00', NULL, NULL, '2026-09-19 11:10:47.636945+00', 2);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type", "versioning_status", "lifecycle_configuration", "lifecycle_configuration_generation") VALUES
	('audience-proofs', 'audience-proofs', NULL, '2026-09-18 13:42:36.770063+00', '2026-09-18 13:42:36.770063+00', false, false, 5242880, '{image/png,image/jpeg,image/webp}', NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('campaign-assets', 'campaign-assets', NULL, '2026-09-18 13:42:36.923511+00', '2026-09-18 13:42:36.923511+00', false, false, 52428800, '{image/png,image/jpeg,image/webp,video/mp4,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation}', NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('content-drafts', 'content-drafts', NULL, '2026-09-18 13:42:37.149398+00', '2026-09-18 13:42:37.149398+00', false, false, 52428800, '{image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm}', NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('metric-proofs', 'metric-proofs', NULL, '2026-09-18 13:42:37.34244+00', '2026-09-18 13:42:37.34244+00', false, false, 10485760, '{image/png,image/jpeg,image/webp,application/pdf}', NULL, 'STANDARD', 'DISABLED', NULL, NULL),
	('finance-proofs', 'finance-proofs', NULL, '2026-09-18 13:42:37.446477+00', '2026-09-18 13:42:37.446477+00', false, false, 10485760, '{image/png,image/jpeg,image/webp,application/pdf}', NULL, 'STANDARD', 'DISABLED', NULL, NULL);


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "archived_at", "is_delete_marker", "is_versioned") VALUES
	('15cb3095-c31a-4e43-8c03-e55cac163d2e', 'audience-proofs', '9964a1ee-8adf-480e-acf2-1ee82ee0965b/f1cd8077-ef6a-4b8f-a6df-a8f10e99ffe4-1789747417223.jpg', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '2026-09-18 16:03:37.387145+00', '2026-09-18 16:03:37.387145+00', '2026-09-18 16:03:37.387145+00', '{"eTag": "\"6d07475028d3f44bc9fc9ec1645fbb59\"", "size": 187664, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-18T16:03:38.000Z", "contentLength": 187664, "httpStatusCode": 200}', '5292f87b-29c2-4e9a-a9e6-e190ed25496e', 'c7f2ed68-4369-47d5-ad79-5d40651058fc', '{}', NULL, false, false),
	('dc73bbc6-b25e-4a7e-bfd3-5e55f5988843', 'campaign-assets', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc/e69184a2-b9c2-44ff-9107-5f3711de8b12-mvi-1497.mov', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 06:42:33.395698+00', '2026-09-19 06:42:33.395698+00', '2026-09-19 06:42:33.395698+00', '{"eTag": "\"84231b2efe46397e83f21d7576424ba8-2\"", "size": 21872164, "mimetype": "video/quicktime", "cacheControl": "max-age=3600", "lastModified": "2026-09-19T06:42:33.000Z", "contentLength": 21872164, "httpStatusCode": 200}', '8d99a690-d16a-4537-b8ee-d58d6c0266c1', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '{}', NULL, false, false),
	('4842de1f-a034-4366-9b1d-4dd43c4959c0', 'finance-proofs', 'd94f2781-fb56-4c6e-ad9d-20acb69585fc/87e2f74d-2a42-4aaf-bfb6-2248b9938247-whatsapp-image-2026-09-16-at-23-04-33.jpeg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-19 07:29:44.380414+00', '2026-09-19 07:29:44.380414+00', '2026-09-19 07:29:44.380414+00', '{"eTag": "\"b0a87da8a1d7f0da736edf7b7ccc1b61\"", "size": 197347, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-19T07:29:45.000Z", "contentLength": 197347, "httpStatusCode": 200}', '56c3399d-8ba7-44c0-80cb-ac39036fb98c', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '{}', NULL, false, false),
	('ff22a03d-a4b2-463a-9ab8-f778dbdc3292', 'content-drafts', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/adbe06c7-044c-4af0-b4fe-5d7ee8fd8fad-screenshot-2026-09-18-113024.jpg', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '2026-09-20 04:25:06.895807+00', '2026-09-20 04:25:06.895807+00', '2026-09-20 04:25:06.895807+00', '{"eTag": "\"6d07475028d3f44bc9fc9ec1645fbb59\"", "size": 187664, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-20T04:25:07.000Z", "contentLength": 187664, "httpStatusCode": 200}', '6b841c00-2d1a-4974-9c5d-589ad99972a9', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '{}', NULL, false, false),
	('bf17ec88-3edb-4b89-99dd-1d7872badba3', 'metric-proofs', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/93e10055-f4e0-4984-afd0-4bad9508a72b-screenshot-2026-09-18-113024.jpg', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '2026-09-20 07:37:46.865615+00', '2026-09-20 07:37:46.865615+00', '2026-09-20 07:37:46.865615+00', '{"eTag": "\"6d07475028d3f44bc9fc9ec1645fbb59\"", "size": 187664, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-20T07:37:47.000Z", "contentLength": 187664, "httpStatusCode": 200}', '7b20a8d7-7c2e-43f6-b9b8-325d60985a2b', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '{}', NULL, false, false),
	('be18f47d-e3e3-47f4-89bc-57e07e31f520', 'metric-proofs', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/29ce61b1-5cc5-43a3-a8fc-e1f450b65791-whatsapp-image-2026-09-16-at-23-04-33.jpeg', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '2026-09-20 07:42:31.469526+00', '2026-09-20 07:42:31.469526+00', '2026-09-20 07:42:31.469526+00', '{"eTag": "\"b0a87da8a1d7f0da736edf7b7ccc1b61\"", "size": 197347, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-20T07:42:32.000Z", "contentLength": 197347, "httpStatusCode": 200}', '6d18a54a-f316-40d4-b58b-ecc60d1e7969', '44afb6e8-a83e-477a-a730-b78cb7d6dcf4', '{}', NULL, false, false),
	('475569a5-0f9a-4591-b162-a1adb53ede3f', 'finance-proofs', '8fa90a3f-b2ef-4574-b4ac-6b9b42d370ac/db1713e4-db89-448c-8a58-b77db13dafa4-screenshot-2026-09-18-143255.jpg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-20 07:44:17.504454+00', '2026-09-20 07:44:17.504454+00', '2026-09-20 07:44:17.504454+00', '{"eTag": "\"4acd846ea70c569b5808d584f2fa2404\"", "size": 81735, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-20T07:44:18.000Z", "contentLength": 81735, "httpStatusCode": 200}', 'eb01becc-94f9-44a6-a7e7-810013fb90d9', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '{}', NULL, false, false),
	('6879363f-565a-4a1a-925d-08c61ab57bec', 'campaign-assets', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163/136391c7-b4ae-457f-b35b-63fb496d6764-profile-ig.png', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 07:12:10.310817+00', '2026-09-24 07:12:10.310817+00', '2026-09-24 07:12:10.310817+00', '{"eTag": "\"fa6219bdb892fb1bf3db76d12351ad39\"", "size": 66446, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-09-24T07:12:11.000Z", "contentLength": 66446, "httpStatusCode": 200}', '1a802e17-86b9-4f4b-bb9b-1a4c85c4808a', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '{}', NULL, false, false),
	('4b37fc36-50dd-474b-ae62-ee000d8dec94', 'metric-proofs', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163/11565658-bd02-4837-8470-73b0b36114e7-screenshot-2026-09-24-214702.jpg', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '2026-09-24 13:47:13.629249+00', '2026-09-24 13:47:13.629249+00', '2026-09-24 13:47:13.629249+00', '{"eTag": "\"443362155207c461f8ee947af73eaf29\"", "size": 28942, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-24T13:47:14.000Z", "contentLength": 28942, "httpStatusCode": 200}', 'fa201838-252b-49fb-9d80-74dfe2a6efff', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '{}', NULL, false, false),
	('2f8a7c4a-3c54-48ce-8520-e6d09b04f625', 'metric-proofs', 'cb3b6220-2ad7-46cf-99c8-15642a5ee163/a5768db7-b108-436d-a919-73f6bed73508-screenshot-2026-09-24-214702.jpg', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '2026-09-24 13:47:27.99751+00', '2026-09-24 13:47:27.99751+00', '2026-09-24 13:47:27.99751+00', '{"eTag": "\"443362155207c461f8ee947af73eaf29\"", "size": 28942, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-24T13:47:28.000Z", "contentLength": 28942, "httpStatusCode": 200}', 'c24c9e27-f606-4138-9957-3da124939c74', '929bdd13-08e7-40a3-a05d-1e5f4356fee1', '{}', NULL, false, false),
	('9b4cbd44-bcd6-4130-af00-f6311d63f63a', 'finance-proofs', 'withdrawals/d4548521-bc34-479c-8977-042b25966da3-whatsapp-image-2026-09-24-at-13-54-23.jpeg', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '2026-09-24 13:52:34.248392+00', '2026-09-24 13:52:34.248392+00', '2026-09-24 13:52:34.248392+00', '{"eTag": "\"3801cad4fef97b7ae225a27dfaf69592\"", "size": 92459, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-24T13:52:35.000Z", "contentLength": 92459, "httpStatusCode": 200}', 'da5ff1c5-193c-4b95-b9f6-1e164b9eae6b', 'c5c0769f-c00f-4a61-9b6d-e676a982d52c', '{}', NULL, false, false);


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 57, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict WUQa3CLEAOuDgXh7rZauTC5ne6y9FtQgVuPL1kedZMAMWUY1DlQnqRN9jpZAa7d

RESET ALL;
