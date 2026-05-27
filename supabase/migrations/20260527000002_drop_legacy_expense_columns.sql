-- expenses.is_owner_charge を完全に廃止。
-- このマイグレーション適用前にコード側の全参照を撤去すること（同一PR内で対応）。

BEGIN;

ALTER TABLE public.expenses DROP COLUMN IF EXISTS is_owner_charge;

COMMIT;
