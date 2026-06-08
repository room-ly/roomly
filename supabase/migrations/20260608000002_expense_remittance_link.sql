-- ============================================================
-- 経費の送金精算紐付け
--   オーナー負担分の経費が「どの送金で精算されたか」を記録する。
--   送金計算は expense_date のレンジでなく「未精算（remittance_id IS NULL）の
--   owner_amount>0 経費」を拾うことで、月跨ぎ・承認遅れの取りこぼしを防ぐ。
-- ============================================================

BEGIN;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS remittance_id uuid
    REFERENCES public.owner_remittances(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.expenses.remittance_id IS
  'この経費のオーナー負担分が精算された送金。NULL=未精算（次回送金で拾われる）';

CREATE INDEX IF NOT EXISTS idx_expenses_remittance
  ON public.expenses(remittance_id);

-- 未精算経費を高速に引くための部分索引（owner_amount>0 かつ未精算）
CREATE INDEX IF NOT EXISTS idx_expenses_unsettled_owner
  ON public.expenses(company_id, owner_id)
  WHERE remittance_id IS NULL AND owner_amount > 0;

COMMIT;
