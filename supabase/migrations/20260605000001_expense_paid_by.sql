-- 経費(費用)に「支払者」を追加する。
-- 負担区分(owner/tenant/company_amount = 最終的に誰のコストか)とは別の軸で、
-- 「誰がまず業者に支払ったか(立替の事実)」を表す。将来の振込CSV出力の対象分けに使う。
--   company_advance : 管理会社が立替（既定）
--   owner_direct    : オーナーが業者へ直接支払い
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS paid_by text NOT NULL DEFAULT 'company_advance';

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_paid_by_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_paid_by_check
  CHECK (paid_by IN ('company_advance', 'owner_direct'));

COMMENT ON COLUMN public.expenses.paid_by IS
  '業者へまず誰が支払ったか(立替の事実)。company_advance=管理会社立替 / owner_direct=オーナー直接。負担区分とは別軸。';
