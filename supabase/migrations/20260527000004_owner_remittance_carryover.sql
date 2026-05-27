-- オーナー送金: マイナス送金を未収金として翌月に繰り越す仕組み
-- 当月の (家賃 - 手数料 - 経費 - 前月繰越) がマイナスになった場合、
-- 送金額は0として確定し、不足分を carryover_to_next に記録する。
-- 翌月の自動計算時に同オーナーの前月レコードから carryover_from_prev として引き継ぎ、控除する。

ALTER TABLE "public"."owner_remittances"
  ADD COLUMN IF NOT EXISTS "carryover_from_prev" numeric(10,0) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "carryover_to_next" numeric(10,0) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN "public"."owner_remittances"."carryover_from_prev" IS '前月から繰り越された未収金（控除として作用）';
COMMENT ON COLUMN "public"."owner_remittances"."carryover_to_next" IS '当月の不足分。翌月の自動計算で前月繰越として参照される';

-- 整合性: 繰越額は非負
ALTER TABLE "public"."owner_remittances"
  DROP CONSTRAINT IF EXISTS owner_remittances_carryover_nonneg;
ALTER TABLE "public"."owner_remittances"
  ADD CONSTRAINT owner_remittances_carryover_nonneg
  CHECK (carryover_from_prev >= 0 AND carryover_to_next >= 0);

-- 整合性: 送金額は非負（繰越方式に切り替えるため）
-- 既存の負の値は0に丸めてから制約を追加する
UPDATE "public"."owner_remittances"
  SET net_amount = 0
  WHERE net_amount < 0;

ALTER TABLE "public"."owner_remittances"
  DROP CONSTRAINT IF EXISTS owner_remittances_net_amount_nonneg;
ALTER TABLE "public"."owner_remittances"
  ADD CONSTRAINT owner_remittances_net_amount_nonneg
  CHECK (net_amount >= 0);
