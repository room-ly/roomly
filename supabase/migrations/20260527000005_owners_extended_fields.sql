-- オーナー情報の拡張カラム追加
-- - 連絡経路（FAX、携帯、緊急連絡先、送付先住所）
-- - 識別情報（フリガナ、生年月日）
-- - 法人対応（owner_type, company_name, representative_name）
-- - 税務（インボイス番号、源泉徴収要否）

ALTER TABLE "public"."owners"
  ADD COLUMN IF NOT EXISTS "name_kana" text,
  ADD COLUMN IF NOT EXISTS "fax" text,
  ADD COLUMN IF NOT EXISTS "mobile_phone" text,
  ADD COLUMN IF NOT EXISTS "birth_date" date,
  ADD COLUMN IF NOT EXISTS "owner_type" text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS "company_name" text,
  ADD COLUMN IF NOT EXISTS "company_name_kana" text,
  ADD COLUMN IF NOT EXISTS "representative_name" text,
  ADD COLUMN IF NOT EXISTS "invoice_number" text,
  ADD COLUMN IF NOT EXISTS "withholding_required" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mailing_address" text,
  ADD COLUMN IF NOT EXISTS "mailing_postal_code" text,
  ADD COLUMN IF NOT EXISTS "emergency_contact_name" text,
  ADD COLUMN IF NOT EXISTS "emergency_contact_phone" text,
  ADD COLUMN IF NOT EXISTS "emergency_contact_relation" text;

-- owner_type は 'individual' / 'corporate' のみ
ALTER TABLE "public"."owners"
  DROP CONSTRAINT IF EXISTS "owners_owner_type_check";
ALTER TABLE "public"."owners"
  ADD CONSTRAINT "owners_owner_type_check"
  CHECK ("owner_type" IN ('individual', 'corporate'));
