-- 敷金取崩し(charge)の理由区分を追加する。
-- 原状回復費は費用(経費)と紐づくが、未払い家賃・違約金の充当は費用にならない。
-- 取崩しの性質を区別できるよう reason を持たせる（charge 以外では NULL）。
ALTER TABLE public.deposit_transactions
  ADD COLUMN IF NOT EXISTS reason text;

-- reason の取りうる値（charge のときのみ意味を持つ）:
--   restoration  : 原状回復費（費用とペアになりうる）
--   unpaid_rent  : 未払い家賃の充当
--   penalty      : 違約金・遅延損害金の充当
--   other        : その他
ALTER TABLE public.deposit_transactions
  DROP CONSTRAINT IF EXISTS deposit_tx_reason_check;
ALTER TABLE public.deposit_transactions
  ADD CONSTRAINT deposit_tx_reason_check
  CHECK (reason IS NULL OR reason IN ('restoration', 'unpaid_rent', 'penalty', 'other'));
