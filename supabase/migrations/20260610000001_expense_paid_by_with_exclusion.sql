-- 費用(expenses)に「一次支払者 paid_by」を再導入する。
--
-- 【経緯】2026-06-05 に一度 paid_by を入れたが、送金除外ロジックが無く中途半端で
-- 2026-06-06 に撤回した（mig 20260605000001 / 20260606000001）。
-- 今回は「owner_direct は送金計算から完全に除外する」をアプリ側ロジックとセットで
-- 入れるため再導入する。
--
-- 【軸の整理】
--   負担区分(owner_amount/tenant_amount/company_amount) = A. 最終的に誰のコストか
--   paid_by                                            = B. 最初に誰が業者へ払うか
--   この2軸は独立。例: paid_by=company かつ owner_amount>0 = 自社が立替、最終はオーナー負担。
--
--   company      : 管理会社が業者へ支払う（立替含む。既定）。owner_amount>0 は送金から相殺し回収
--   owner_direct : オーナーが業者へ直接支払う。管理会社のキャッシュは動かない＝記録のみ。
--                  送金計算からは除外する（remittance-data.ts の集約クエリで .neq で弾く）
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS paid_by text NOT NULL DEFAULT 'company';

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_paid_by_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_paid_by_check
  CHECK (paid_by IN ('company', 'owner_direct'));

COMMENT ON COLUMN public.expenses.paid_by IS
  '一次支払者(誰がまず業者へ払うか)。company=管理会社が支払う(立替含む) / owner_direct=オーナー直接払い。owner_direct はオーナー送金計算から除外する。負担区分(最終負担)とは別軸。';

-- 送金集約クエリ（owner_id + remittance_id IS NULL + owner_amount>0 + status）に
-- paid_by の絞り込みが加わるため、複合的に効くよう部分インデックスを張る。
CREATE INDEX IF NOT EXISTS idx_expenses_remittance_pickup
  ON public.expenses (owner_id, paid_by)
  WHERE remittance_id IS NULL AND owner_amount > 0;
