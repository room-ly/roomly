-- 家賃回収率の目標値を会社ごとに設定できるようにする
-- ダッシュボードの「家賃回収率 月次推移」チャートの目標ライン表示に使う。
-- 単位は% (整数)。デフォルト95。
ALTER TABLE "public"."companies"
  ADD COLUMN IF NOT EXISTS "rent_collection_target_rate" integer NOT NULL DEFAULT 95;

-- 0〜100の範囲に制限（目標として現実的な値のみ許容）
ALTER TABLE "public"."companies"
  DROP CONSTRAINT IF EXISTS "companies_rent_collection_target_rate_check";
ALTER TABLE "public"."companies"
  ADD CONSTRAINT "companies_rent_collection_target_rate_check"
  CHECK ("rent_collection_target_rate" >= 0 AND "rent_collection_target_rate" <= 100);

COMMENT ON COLUMN "public"."companies"."rent_collection_target_rate" IS '家賃回収率の目標値(%)。ダッシュボードの目標ライン表示に使用。';
