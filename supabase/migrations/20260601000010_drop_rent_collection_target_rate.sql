-- 家賃回収率の目標値カラムを削除する。
-- 家賃回収率は「100%が正常・それ以外は未回収=取りこぼし」という性質のため、
-- 可変の目標値は設けず、ダッシュボードのチャートは100%固定の基準線で表示する方針に変更した。
-- （20260601000009 で追加したカラムを撤回）
ALTER TABLE "public"."companies"
  DROP CONSTRAINT IF EXISTS "companies_rent_collection_target_rate_check";
ALTER TABLE "public"."companies"
  DROP COLUMN IF EXISTS "rent_collection_target_rate";
