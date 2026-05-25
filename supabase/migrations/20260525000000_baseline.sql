-- 00000 baseline
-- 2026-05-25 時点のリモートDBスキーマ全体を1ファイルに集約したbaseline。
-- これ以前の 00001〜00048 は supabase/migrations/_archive/ に退避済み（適用済み・参照用）。
-- 駅・路線マスタのデータは 00001_station_master_seed.sql で投入する。




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."cleanup_old_login_attempts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '24 hours';
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_login_attempts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid,
    null
  );
$$;


ALTER FUNCTION "public"."company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  claims jsonb;
  v_company_id uuid;
  v_role text;
  v_tenant_id uuid;
begin
  claims := event->'claims';

  -- まず管理画面ユーザーとして検索
  select company_id, role into v_company_id, v_role
  from public.users
  where id = (event->>'user_id')::uuid;

  if v_company_id is not null then
    claims := jsonb_set(claims, '{company_id}', to_jsonb(v_company_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{user_type}', '"staff"');
  else
    -- 入居者として検索
    select tenant_id, company_id into v_tenant_id, v_company_id
    from public.tenant_auth_users
    where auth_user_id = (event->>'user_id')::uuid;

    if v_tenant_id is not null then
      claims := jsonb_set(claims, '{company_id}', to_jsonb(v_company_id::text));
      claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
      claims := jsonb_set(claims, '{user_type}', '"tenant"');
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_subscription_active"("company_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists(
    select 1 from public.companies
    where id = company_id
      and subscription_status = 'active'
      and (subscription_current_period_end is null or subscription_current_period_end > now())
  );
$$;


ALTER FUNCTION "public"."is_subscription_active"("company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    null
  );
$$;


ALTER FUNCTION "public"."tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json->>'user_role'),
    'viewer'
  );
$$;


ALTER FUNCTION "public"."user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_type"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    current_setting('request.jwt.claims', true)::json->>'user_type',
    'staff'
  );
$$;


ALTER FUNCTION "public"."user_type"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "postal_code" "text",
    "address" "text",
    "phone" "text",
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "max_units" integer DEFAULT 10 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "usage_type" "text" DEFAULT 'management_company'::"text" NOT NULL,
    "contract_alert_days" integer DEFAULT 90 NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text" DEFAULT 'none'::"text" NOT NULL,
    "subscription_current_period_end" timestamp with time zone,
    "estate_license" "text",
    "estate_agent_name" "text",
    "estate_agent_license" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "bank_name" "text" NOT NULL,
    "bank_code" "text" NOT NULL,
    "branch_name" "text" NOT NULL,
    "branch_code" "text" NOT NULL,
    "account_type" "text" DEFAULT '1'::"text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder" "text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "contract_type" "text" DEFAULT 'fixed'::"text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "rent" numeric(10,0) NOT NULL,
    "management_fee" numeric(10,0) DEFAULT 0 NOT NULL,
    "deposit" numeric(10,0) DEFAULT 0 NOT NULL,
    "key_money" numeric(10,0) DEFAULT 0 NOT NULL,
    "renewal_fee" numeric(10,0) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "move_in_date" "date",
    "move_out_date" "date",
    "special_terms" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signed_date" "date",
    "important_explanation_date" "date",
    "payment_method" "text",
    "payment_due_day" integer,
    "guarantor_name" "text",
    "guarantor_phone" "text",
    "insurance_company" "text",
    "brokerage_fee" numeric(10,0)
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_clicks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "ip" "text" DEFAULT ''::"text",
    "country" "text" DEFAULT ''::"text",
    "city" "text" DEFAULT ''::"text",
    "user_agent" "text" DEFAULT ''::"text",
    "referrer" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "project" "text" DEFAULT 'roomly'::"text" NOT NULL,
    "region" "text" DEFAULT ''::"text"
);


ALTER TABLE "public"."demo_clicks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "unit_id" "uuid",
    "tenant_id" "uuid",
    "contract_id" "uuid",
    "document_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "notes" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "unit_id" "uuid",
    "owner_id" "uuid",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,0) NOT NULL,
    "expense_date" "date" NOT NULL,
    "is_owner_charge" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payee_id" "uuid"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "unit_id" "uuid",
    "tenant_id" "uuid",
    "inquiry_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "linked_maintenance_id" "uuid",
    "linked_move_out_request_id" "uuid"
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inquiry_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "inquiry_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "action_type" "text" NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inquiry_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "success" boolean DEFAULT false NOT NULL,
    "ip_address" "text"
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "request_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."maintenance_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "unit_id" "uuid",
    "tenant_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "reported_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "completed_date" "date",
    "vendor_name" "text",
    "estimated_cost" numeric(10,0),
    "actual_cost" numeric(10,0),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'admin'::"text" NOT NULL,
    "payee_id" "uuid"
);


ALTER TABLE "public"."maintenance_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."move_out_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "desired_move_out_date" "date" NOT NULL,
    "reason" "text",
    "forwarding_postal_code" "text",
    "forwarding_address" "text",
    "forwarding_phone" "text",
    "bank_name" "text",
    "bank_branch" "text",
    "bank_account_type" "text" DEFAULT '普通'::"text",
    "bank_account_number" "text",
    "bank_account_holder" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_log" "text"
);


ALTER TABLE "public"."move_out_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "body" "text",
    "type" "text" DEFAULT 'info'::"text" NOT NULL,
    "link" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_remittance_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "remittance_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,0) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."owner_remittance_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_remittances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "remittance_month" "date" NOT NULL,
    "total_rent" numeric(10,0) DEFAULT 0 NOT NULL,
    "management_fee_deducted" numeric(10,0) DEFAULT 0 NOT NULL,
    "expense_deducted" numeric(10,0) DEFAULT 0 NOT NULL,
    "net_amount" numeric(10,0) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "sent_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method" "text" DEFAULT 'transfer'::"text" NOT NULL,
    "manual_override" boolean DEFAULT false NOT NULL,
    "manual_net_amount" numeric(10,0)
);


ALTER TABLE "public"."owner_remittances" OWNER TO "postgres";


COMMENT ON COLUMN "public"."owner_remittances"."payment_method" IS 'transfer=振込 / cash=現金';



COMMENT ON COLUMN "public"."owner_remittances"."manual_override" IS '金額を手動上書きしたか';



COMMENT ON COLUMN "public"."owner_remittances"."manual_net_amount" IS '手動上書き時の送金額（nullなら自動計算値を使用）';



CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "postal_code" "text",
    "address" "text",
    "bank_name" "text",
    "bank_branch" "text",
    "bank_account_type" "text",
    "bank_account_number" "text",
    "bank_account_holder" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bank_code" "text",
    "bank_branch_code" "text"
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "name_kana" "text",
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "phone" "text",
    "notes" "text",
    "bank_code" "text",
    "bank_name" "text",
    "branch_code" "text",
    "branch_name" "text",
    "account_type" "text" DEFAULT 'ordinary'::"text" NOT NULL,
    "account_number" "text",
    "account_holder_kana" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "property_type" "text" DEFAULT 'apartment'::"text" NOT NULL,
    "postal_code" "text",
    "address" "text" NOT NULL,
    "structure" "text",
    "floors" integer,
    "built_year" integer,
    "total_units" integer,
    "nearest_station" "text",
    "walk_minutes" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name_kana" "text",
    "property_code" "text",
    "prefecture" "text",
    "city" "text",
    "town" "text",
    "building_number" "text",
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "nearest_station_2" "text",
    "walk_minutes_2" integer,
    "nearest_station_3" "text",
    "walk_minutes_3" integer,
    "bus_station" "text",
    "bus_minutes" integer,
    "underground_floors" integer,
    "total_area_sqm" numeric(10,2),
    "building_area_sqm" numeric(10,2),
    "land_area_sqm" numeric(10,2),
    "built_month" integer,
    "renovation_year" integer,
    "renovation_month" integer,
    "management_form" "text",
    "management_company" "text",
    "parking" "text",
    "parking_fee" numeric(10,0),
    "bicycle_parking" "text",
    "bike_parking" "text",
    "common_facilities" "text"[],
    "land_use_zone" "text",
    "land_rights" "text",
    "building_coverage_ratio" numeric(5,2),
    "floor_area_ratio" numeric(5,2),
    "zoning" "text",
    "transaction_type" "text",
    "appeal_points" "text",
    "internal_memo" "text",
    "management_fee_rate" numeric(5,2) DEFAULT 5.00 NOT NULL,
    "registered_owner_name" "text",
    "mortgage_exists" boolean DEFAULT false,
    "mortgagee" "text",
    "mortgage_amount" numeric(15,0),
    "water_supply" "text",
    "gas_type" "text",
    "electricity" "text",
    "sewage" "text",
    "septic_tank" boolean DEFAULT false,
    "asbestos_survey" "text",
    "earthquake_resistance" "text",
    "flood_hazard_zone" boolean DEFAULT false,
    "landslide_hazard_zone" boolean DEFAULT false,
    "tsunami_hazard_zone" boolean DEFAULT false,
    "nearest_station_id" "text",
    "nearest_station_2_id" "text",
    "nearest_station_3_id" "text"
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rent_billings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "billing_month" "date" NOT NULL,
    "rent" numeric(10,0) NOT NULL,
    "management_fee" numeric(10,0) DEFAULT 0 NOT NULL,
    "other_amount" numeric(10,0) DEFAULT 0 NOT NULL,
    "other_description" "text",
    "total_amount" numeric(10,0) NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rent_billings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rent_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "billing_id" "uuid" NOT NULL,
    "amount" numeric(10,0) NOT NULL,
    "payment_date" "date" NOT NULL,
    "payment_method" "text" DEFAULT 'transfer'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rent_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stations" (
    "station_cd" "text" NOT NULL,
    "station_name" "text" NOT NULL,
    "line_cd" integer,
    "station_g_cd" "text",
    "pref_cd" "text",
    "lon" numeric(10,7),
    "lat" numeric(10,7),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_auth_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_login_at" timestamp with time zone
);


ALTER TABLE "public"."tenant_auth_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "name_kana" "text",
    "phone" "text",
    "email" "text",
    "postal_code" "text",
    "address" "text",
    "date_of_birth" "date",
    "workplace" "text",
    "workplace_phone" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "emergency_contact_relation" "text",
    "guarantor_name" "text",
    "guarantor_phone" "text",
    "guarantor_address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gender" "text",
    "nationality" "text",
    "annual_income" integer,
    "guarantor_name_kana" "text",
    "guarantor_date_of_birth" "date",
    "guarantor_workplace" "text",
    "guarantor_workplace_phone" "text",
    "guarantor_annual_income" integer,
    "guarantor_relation" "text"
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."train_lines" (
    "line_cd" integer NOT NULL,
    "company_name" "text",
    "line_name" "text" NOT NULL,
    "lon" numeric(10,7),
    "lat" numeric(10,7),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."train_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "unit_number" "text" NOT NULL,
    "floor" integer,
    "layout" "text",
    "area_sqm" numeric(8,2),
    "rent" numeric(10,0) DEFAULT 0 NOT NULL,
    "management_fee" numeric(10,0) DEFAULT 0 NOT NULL,
    "deposit" numeric(10,0) DEFAULT 0 NOT NULL,
    "key_money" numeric(10,0) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'vacant'::"text" NOT NULL,
    "equipment" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vacancies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "available_from" "date" NOT NULL,
    "listing_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "ad_comment" "text",
    "viewing_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vacancies" OWNER TO "postgres";


ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_bank_accounts"
    ADD CONSTRAINT "company_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_clicks"
    ADD CONSTRAINT "demo_clicks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiry_logs"
    ADD CONSTRAINT "inquiry_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_remittance_items"
    ADD CONSTRAINT "owner_remittance_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_remittances"
    ADD CONSTRAINT "owner_remittances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payees"
    ADD CONSTRAINT "payees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rent_billings"
    ADD CONSTRAINT "rent_billings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rent_payments"
    ADD CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stations"
    ADD CONSTRAINT "stations_pkey" PRIMARY KEY ("station_cd");



ALTER TABLE ONLY "public"."tenant_auth_users"
    ADD CONSTRAINT "tenant_auth_users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."tenant_auth_users"
    ADD CONSTRAINT "tenant_auth_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."train_lines"
    ADD CONSTRAINT "train_lines_pkey" PRIMARY KEY ("line_cd");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vacancies"
    ADD CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_company_bank_accounts_company" ON "public"."company_bank_accounts" USING "btree" ("company_id");



CREATE INDEX "idx_contracts_company" ON "public"."contracts" USING "btree" ("company_id");



CREATE INDEX "idx_contracts_status" ON "public"."contracts" USING "btree" ("status");



CREATE INDEX "idx_contracts_tenant" ON "public"."contracts" USING "btree" ("tenant_id");



CREATE INDEX "idx_contracts_tenant_id" ON "public"."contracts" USING "btree" ("tenant_id");



CREATE INDEX "idx_contracts_unit" ON "public"."contracts" USING "btree" ("unit_id");



CREATE INDEX "idx_documents_company" ON "public"."documents" USING "btree" ("company_id");



CREATE UNIQUE INDEX "idx_documents_primary_property" ON "public"."documents" USING "btree" ("property_id") WHERE (("is_primary" = true) AND ("unit_id" IS NULL) AND ("document_type" = 'photo'::"text"));



CREATE UNIQUE INDEX "idx_documents_primary_unit" ON "public"."documents" USING "btree" ("unit_id") WHERE (("is_primary" = true) AND ("unit_id" IS NOT NULL) AND ("document_type" = 'photo'::"text"));



CREATE INDEX "idx_documents_property_id" ON "public"."documents" USING "btree" ("property_id");



CREATE INDEX "idx_expenses_company" ON "public"."expenses" USING "btree" ("company_id");



CREATE INDEX "idx_expenses_payee" ON "public"."expenses" USING "btree" ("payee_id");



CREATE INDEX "idx_expenses_property" ON "public"."expenses" USING "btree" ("property_id");



CREATE INDEX "idx_expenses_property_id" ON "public"."expenses" USING "btree" ("property_id");



CREATE INDEX "idx_inquiries_company" ON "public"."inquiries" USING "btree" ("company_id");



CREATE INDEX "idx_inquiries_status" ON "public"."inquiries" USING "btree" ("status");



CREATE INDEX "idx_inquiry_logs_inquiry_id" ON "public"."inquiry_logs" USING "btree" ("inquiry_id");



CREATE INDEX "idx_login_attempts_email_time" ON "public"."login_attempts" USING "btree" ("email", "attempted_at" DESC);



CREATE INDEX "idx_maintenance_company" ON "public"."maintenance_requests" USING "btree" ("company_id");



CREATE INDEX "idx_maintenance_logs_request_id" ON "public"."maintenance_logs" USING "btree" ("request_id");



CREATE INDEX "idx_maintenance_payee" ON "public"."maintenance_requests" USING "btree" ("payee_id");



CREATE INDEX "idx_maintenance_requests_status" ON "public"."maintenance_requests" USING "btree" ("status");



CREATE INDEX "idx_maintenance_requests_unit_id" ON "public"."maintenance_requests" USING "btree" ("unit_id");



CREATE INDEX "idx_maintenance_status" ON "public"."maintenance_requests" USING "btree" ("status");



CREATE INDEX "idx_move_out_requests_company" ON "public"."move_out_requests" USING "btree" ("company_id");



CREATE INDEX "idx_move_out_requests_contract" ON "public"."move_out_requests" USING "btree" ("contract_id");



CREATE INDEX "idx_move_out_requests_status" ON "public"."move_out_requests" USING "btree" ("status");



CREATE INDEX "idx_move_out_requests_tenant" ON "public"."move_out_requests" USING "btree" ("tenant_id");



CREATE INDEX "idx_notifications_company" ON "public"."notifications" USING "btree" ("company_id");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_owner_remittance_items_remittance_id" ON "public"."owner_remittance_items" USING "btree" ("remittance_id");



CREATE INDEX "idx_owner_remittances_company" ON "public"."owner_remittances" USING "btree" ("company_id");



CREATE INDEX "idx_owner_remittances_owner" ON "public"."owner_remittances" USING "btree" ("owner_id");



CREATE INDEX "idx_owner_remittances_owner_id" ON "public"."owner_remittances" USING "btree" ("owner_id");



CREATE INDEX "idx_owners_company" ON "public"."owners" USING "btree" ("company_id");



CREATE INDEX "idx_payees_company" ON "public"."payees" USING "btree" ("company_id");



CREATE INDEX "idx_properties_company" ON "public"."properties" USING "btree" ("company_id");



CREATE INDEX "idx_properties_nearest_station_id" ON "public"."properties" USING "btree" ("nearest_station_id");



CREATE INDEX "idx_properties_owner" ON "public"."properties" USING "btree" ("owner_id");



CREATE INDEX "idx_rent_billings_company" ON "public"."rent_billings" USING "btree" ("company_id");



CREATE INDEX "idx_rent_billings_contract" ON "public"."rent_billings" USING "btree" ("contract_id");



CREATE INDEX "idx_rent_billings_contract_id" ON "public"."rent_billings" USING "btree" ("contract_id");



CREATE INDEX "idx_rent_billings_month" ON "public"."rent_billings" USING "btree" ("billing_month");



CREATE INDEX "idx_rent_billings_status" ON "public"."rent_billings" USING "btree" ("status");



CREATE INDEX "idx_rent_payments_billing" ON "public"."rent_payments" USING "btree" ("billing_id");



CREATE INDEX "idx_rent_payments_company" ON "public"."rent_payments" USING "btree" ("company_id");



CREATE INDEX "idx_stations_g_cd" ON "public"."stations" USING "btree" ("station_g_cd");



CREATE INDEX "idx_stations_line" ON "public"."stations" USING "btree" ("line_cd");



CREATE INDEX "idx_stations_name" ON "public"."stations" USING "btree" ("station_name");



CREATE INDEX "idx_tenant_auth_users_company" ON "public"."tenant_auth_users" USING "btree" ("company_id");



CREATE INDEX "idx_tenant_auth_users_tenant" ON "public"."tenant_auth_users" USING "btree" ("tenant_id");



CREATE INDEX "idx_tenants_company" ON "public"."tenants" USING "btree" ("company_id");



CREATE INDEX "idx_units_company" ON "public"."units" USING "btree" ("company_id");



CREATE INDEX "idx_units_property" ON "public"."units" USING "btree" ("property_id");



CREATE INDEX "idx_units_property_id" ON "public"."units" USING "btree" ("property_id");



CREATE INDEX "idx_units_status" ON "public"."units" USING "btree" ("status");



CREATE INDEX "idx_users_company" ON "public"."users" USING "btree" ("company_id");



CREATE INDEX "idx_vacancies_company" ON "public"."vacancies" USING "btree" ("company_id");



CREATE INDEX "idx_vacancies_unit" ON "public"."vacancies" USING "btree" ("unit_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."inquiries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."maintenance_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."owner_remittances" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."rent_billings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."vacancies" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_company_bank_accounts" BEFORE UPDATE ON "public"."company_bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_cleanup_login_attempts" AFTER INSERT ON "public"."login_attempts" FOR EACH STATEMENT EXECUTE FUNCTION "public"."cleanup_old_login_attempts"();



ALTER TABLE ONLY "public"."company_bank_accounts"
    ADD CONSTRAINT "company_bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_linked_maintenance_id_fkey" FOREIGN KEY ("linked_maintenance_id") REFERENCES "public"."maintenance_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_linked_move_out_request_id_fkey" FOREIGN KEY ("linked_move_out_request_id") REFERENCES "public"."move_out_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inquiry_logs"
    ADD CONSTRAINT "inquiry_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiry_logs"
    ADD CONSTRAINT "inquiry_logs_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiry_logs"
    ADD CONSTRAINT "inquiry_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."maintenance_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_logs"
    ADD CONSTRAINT "maintenance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."payees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maintenance_requests"
    ADD CONSTRAINT "maintenance_requests_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."move_out_requests"
    ADD CONSTRAINT "move_out_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_remittance_items"
    ADD CONSTRAINT "owner_remittance_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_remittance_items"
    ADD CONSTRAINT "owner_remittance_items_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "public"."owner_remittances"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_remittance_items"
    ADD CONSTRAINT "owner_remittance_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."owner_remittances"
    ADD CONSTRAINT "owner_remittances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_remittances"
    ADD CONSTRAINT "owner_remittances_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payees"
    ADD CONSTRAINT "payees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_nearest_station_2_id_fkey" FOREIGN KEY ("nearest_station_2_id") REFERENCES "public"."stations"("station_cd");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_nearest_station_3_id_fkey" FOREIGN KEY ("nearest_station_3_id") REFERENCES "public"."stations"("station_cd");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_nearest_station_id_fkey" FOREIGN KEY ("nearest_station_id") REFERENCES "public"."stations"("station_cd");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rent_billings"
    ADD CONSTRAINT "rent_billings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rent_billings"
    ADD CONSTRAINT "rent_billings_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rent_payments"
    ADD CONSTRAINT "rent_payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "public"."rent_billings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rent_payments"
    ADD CONSTRAINT "rent_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stations"
    ADD CONSTRAINT "stations_line_cd_fkey" FOREIGN KEY ("line_cd") REFERENCES "public"."train_lines"("line_cd");



ALTER TABLE ONLY "public"."tenant_auth_users"
    ADD CONSTRAINT "tenant_auth_users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_auth_users"
    ADD CONSTRAINT "tenant_auth_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_auth_users"
    ADD CONSTRAINT "tenant_auth_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vacancies"
    ADD CONSTRAINT "vacancies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vacancies"
    ADD CONSTRAINT "vacancies_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



CREATE POLICY "anon can insert demo_clicks" ON "public"."demo_clicks" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon_insert_demo_clicks" ON "public"."demo_clicks" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "authenticated can select demo_clicks" ON "public"."demo_clicks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_insert_demo_clicks" ON "public"."demo_clicks" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_tenant_policy" ON "public"."companies" USING (("id" = "public"."company_id"()));



CREATE POLICY "companies_tenant_user_select" ON "public"."companies" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("id" = "public"."company_id"())));



ALTER TABLE "public"."company_bank_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_bank_accounts_delete" ON "public"."company_bank_accounts" FOR DELETE USING (("company_id" = "public"."company_id"()));



CREATE POLICY "company_bank_accounts_insert" ON "public"."company_bank_accounts" FOR INSERT WITH CHECK (("company_id" = "public"."company_id"()));



CREATE POLICY "company_bank_accounts_select" ON "public"."company_bank_accounts" FOR SELECT USING (("company_id" = "public"."company_id"()));



CREATE POLICY "company_bank_accounts_update" ON "public"."company_bank_accounts" FOR UPDATE USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contracts_tenant_policy" ON "public"."contracts" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "contracts_tenant_user_select" ON "public"."contracts" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("tenant_id" = "public"."tenant_id"())));



ALTER TABLE "public"."demo_clicks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_tenant_policy" ON "public"."documents" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses_tenant_policy" ON "public"."expenses" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inquiries_tenant_policy" ON "public"."inquiries" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."inquiry_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inquiry_logs_tenant_policy" ON "public"."inquiry_logs" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maintenance_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maintenance_logs_tenant_policy" ON "public"."maintenance_logs" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."maintenance_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maintenance_requests_tenant_policy" ON "public"."maintenance_requests" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "maintenance_tenant_insert" ON "public"."maintenance_requests" FOR INSERT WITH CHECK ((("public"."user_type"() = 'tenant'::"text") AND ("tenant_id" = "public"."tenant_id"()) AND ("company_id" = "public"."company_id"())));



CREATE POLICY "maintenance_tenant_select" ON "public"."maintenance_requests" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("tenant_id" = "public"."tenant_id"())));



ALTER TABLE "public"."move_out_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "move_out_requests_staff_policy" ON "public"."move_out_requests" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "move_out_requests_tenant_insert" ON "public"."move_out_requests" FOR INSERT WITH CHECK ((("public"."user_type"() = 'tenant'::"text") AND ("tenant_id" = "public"."tenant_id"()) AND ("company_id" = "public"."company_id"())));



CREATE POLICY "move_out_requests_tenant_select" ON "public"."move_out_requests" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("tenant_id" = "public"."tenant_id"())));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_tenant_policy" ON "public"."notifications" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."owner_remittance_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_remittance_items_tenant_policy" ON "public"."owner_remittance_items" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."owner_remittances" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_remittances_tenant_policy" ON "public"."owner_remittances" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners_tenant_policy" ON "public"."owners" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."payees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payees: company members only" ON "public"."payees" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "portal_read_properties" ON "public"."properties" FOR SELECT TO "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."units" "u"
  WHERE (("u"."property_id" = "properties"."id") AND ("u"."status" = 'vacant'::"text")))));



CREATE POLICY "portal_read_units" ON "public"."units" FOR SELECT TO "anon" USING (("status" = 'vacant'::"text"));



CREATE POLICY "portal_read_vacancies" ON "public"."vacancies" FOR SELECT TO "anon" USING (("listing_status" = 'active'::"text"));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties_tenant_policy" ON "public"."properties" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "properties_tenant_user_select" ON "public"."properties" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("id" IN ( SELECT "units"."property_id"
   FROM "public"."units"
  WHERE ("units"."id" IN ( SELECT "contracts"."unit_id"
           FROM "public"."contracts"
          WHERE (("contracts"."tenant_id" = "public"."tenant_id"()) AND ("contracts"."status" = 'active'::"text"))))))));



CREATE POLICY "read_stations" ON "public"."stations" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "read_train_lines" ON "public"."train_lines" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."rent_billings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rent_billings_tenant_policy" ON "public"."rent_billings" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."rent_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rent_payments_tenant_policy" ON "public"."rent_payments" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "service_role_only" ON "public"."login_attempts" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."stations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_auth_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_auth_users_staff_policy" ON "public"."tenant_auth_users" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_tenant_policy" ON "public"."tenants" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "tenants_tenant_user_select" ON "public"."tenants" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("id" = "public"."tenant_id"())));



ALTER TABLE "public"."train_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."units" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "units_tenant_policy" ON "public"."units" USING (("company_id" = "public"."company_id"()));



CREATE POLICY "units_tenant_user_select" ON "public"."units" FOR SELECT USING ((("public"."user_type"() = 'tenant'::"text") AND ("id" IN ( SELECT "contracts"."unit_id"
   FROM "public"."contracts"
  WHERE (("contracts"."tenant_id" = "public"."tenant_id"()) AND ("contracts"."status" = 'active'::"text"))))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_self_select" ON "public"."users" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "users_tenant_policy" ON "public"."users" USING (("company_id" = "public"."company_id"()));



ALTER TABLE "public"."vacancies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vacancies_tenant_policy" ON "public"."vacancies" USING (("company_id" = "public"."company_id"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";






















































































































































GRANT ALL ON FUNCTION "public"."cleanup_old_login_attempts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_login_attempts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_login_attempts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."company_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."is_subscription_active"("company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_subscription_active"("company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_subscription_active"("company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_type"() TO "service_role";


















GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."company_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."company_bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."demo_clicks" TO "anon";
GRANT ALL ON TABLE "public"."demo_clicks" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_clicks" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."inquiry_logs" TO "anon";
GRANT ALL ON TABLE "public"."inquiry_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiry_logs" TO "service_role";



GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_logs" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_logs" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance_requests" TO "anon";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance_requests" TO "service_role";



GRANT ALL ON TABLE "public"."move_out_requests" TO "anon";
GRANT ALL ON TABLE "public"."move_out_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."move_out_requests" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."owner_remittance_items" TO "anon";
GRANT ALL ON TABLE "public"."owner_remittance_items" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_remittance_items" TO "service_role";



GRANT ALL ON TABLE "public"."owner_remittances" TO "anon";
GRANT ALL ON TABLE "public"."owner_remittances" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_remittances" TO "service_role";



GRANT ALL ON TABLE "public"."owners" TO "anon";
GRANT ALL ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."payees" TO "anon";
GRANT ALL ON TABLE "public"."payees" TO "authenticated";
GRANT ALL ON TABLE "public"."payees" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."rent_billings" TO "anon";
GRANT ALL ON TABLE "public"."rent_billings" TO "authenticated";
GRANT ALL ON TABLE "public"."rent_billings" TO "service_role";



GRANT ALL ON TABLE "public"."rent_payments" TO "anon";
GRANT ALL ON TABLE "public"."rent_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."rent_payments" TO "service_role";



GRANT ALL ON TABLE "public"."stations" TO "anon";
GRANT ALL ON TABLE "public"."stations" TO "authenticated";
GRANT ALL ON TABLE "public"."stations" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_auth_users" TO "anon";
GRANT ALL ON TABLE "public"."tenant_auth_users" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_auth_users" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."train_lines" TO "anon";
GRANT ALL ON TABLE "public"."train_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."train_lines" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vacancies" TO "anon";
GRANT ALL ON TABLE "public"."vacancies" TO "authenticated";
GRANT ALL ON TABLE "public"."vacancies" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































