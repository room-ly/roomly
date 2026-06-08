-- ============================================================
-- owner_remittance_items: 送金明細行を実際に保存できるようにする
--   - 手数料・経費・調整行は特定の部屋に紐付かないため unit_id を NULL 許可
--   - item_type の取りうる値を CHECK で明示
-- ============================================================

BEGIN;

ALTER TABLE public.owner_remittance_items
  ALTER COLUMN unit_id DROP NOT NULL;

ALTER TABLE public.owner_remittance_items
  DROP CONSTRAINT IF EXISTS owner_remittance_items_type_check;
ALTER TABLE public.owner_remittance_items
  ADD CONSTRAINT owner_remittance_items_type_check
    CHECK (item_type IN ('rent', 'management_fee', 'management_fee_tax', 'expense', 'adjustment'));

COMMIT;
