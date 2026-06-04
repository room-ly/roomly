-- expenses.paid_by を撤回する。
-- 「業者へ誰が払うか」という軸は実務とズレていた（支払い出力=振込CSVは常に管理会社からの振込）。
-- 本当に必要なのは「オーナー負担分の回収方法（送金相殺で引けない不足分はオーナーへ請求）」で、
-- これは送金計算側(carryoverToNext)を「オーナー請求」として扱う方向で対応する。
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_paid_by_check;
ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS paid_by;
