-- ============================================================
-- オーナー送金: 実務整合性の強化 + 管理手数料の消費税対応
--
-- 【前提となるDB実体のズレ修正】
--   本番 owner_remittances には carryover_from_prev/carryover_to_next が
--   存在しない（履歴 20260527000004 は記録のみで実体に未反映）。一方コードは
--   carryover_to_next に読み書きしており送金生成が壊れていた。
--   ここで carryover 概念を廃止し owner_bill_amount に一本化する。
--   未使用の transfer_date 列（手動追加・全NULL）も削除する。
--
--   1. companies: 管理手数料の消費税率・課税事業者フラグ
--   2. owner_remittances:
--        - owner_bill_amount 列（オーナーへの不足分請求額）
--        - management_fee_tax 列（外税の消費税額）
--        - 不要な carryover_* / transfer_date を念のため DROP（存在すれば）
--        - (company_id, owner_id, remittance_month) UNIQUE（重複送金防止）
--        - sent/confirmed 後の金額系カラムの変更を禁止するトリガ
--   3. owner_remittances.status の CHECK を明示
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. companies: 消費税設定
-- ------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_tax_invoice_issuer boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS management_fee_tax_rate numeric(4,3) DEFAULT 0.10 NOT NULL;

COMMENT ON COLUMN public.companies.is_tax_invoice_issuer IS
  '適格請求書発行事業者（課税事業者）か。true のとき管理手数料に外税で消費税を付与する';
COMMENT ON COLUMN public.companies.management_fee_tax_rate IS
  '管理手数料に適用する消費税率（例: 0.10 = 10%）';

-- ------------------------------------------------------------
-- 2. owner_remittances: 列追加
-- ------------------------------------------------------------
ALTER TABLE public.owner_remittances
  ADD COLUMN IF NOT EXISTS owner_bill_amount numeric(10,0) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS management_fee_tax numeric(10,0) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN public.owner_remittances.owner_bill_amount IS
  '費用が家賃収入を超過した不足分。オーナーへ請求する額（翌月へは繰り越さない）';
COMMENT ON COLUMN public.owner_remittances.management_fee_tax IS
  '管理手数料に対する消費税額（外税）。management_fee_deducted は税抜額';

-- carryover 概念を廃止（存在する環境でのみ移行してから DROP）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='owner_remittances'
      AND column_name='carryover_to_next'
  ) THEN
    UPDATE public.owner_remittances
       SET owner_bill_amount = carryover_to_next
     WHERE owner_bill_amount = 0 AND carryover_to_next > 0;
  END IF;
END $$;

ALTER TABLE public.owner_remittances
  DROP CONSTRAINT IF EXISTS owner_remittances_carryover_nonneg,
  DROP CONSTRAINT IF EXISTS owner_remittances_net_amount_nonneg;

ALTER TABLE public.owner_remittances
  DROP COLUMN IF EXISTS carryover_from_prev,
  DROP COLUMN IF EXISTS carryover_to_next,
  DROP COLUMN IF EXISTS transfer_date;

-- net_amount 非負制約は維持（繰越廃止後も送金額はマイナスにしない）
ALTER TABLE public.owner_remittances
  DROP CONSTRAINT IF EXISTS owner_remittances_net_amount_nonneg;
ALTER TABLE public.owner_remittances
  ADD CONSTRAINT owner_remittances_net_amount_nonneg CHECK (net_amount >= 0);

ALTER TABLE public.owner_remittances
  DROP CONSTRAINT IF EXISTS owner_remittances_owner_bill_nonneg;
ALTER TABLE public.owner_remittances
  ADD CONSTRAINT owner_remittances_owner_bill_nonneg
    CHECK (owner_bill_amount >= 0 AND management_fee_tax >= 0);

-- ------------------------------------------------------------
-- 3. status の CHECK を明示
-- ------------------------------------------------------------
ALTER TABLE public.owner_remittances
  DROP CONSTRAINT IF EXISTS owner_remittances_status_check;
ALTER TABLE public.owner_remittances
  ADD CONSTRAINT owner_remittances_status_check
    CHECK (status IN ('draft', 'confirmed', 'sent'));

-- ------------------------------------------------------------
-- 4. 重複送金防止: 同一オーナー・同一月の送金は1件のみ
-- ------------------------------------------------------------
-- 既存の重複があると索引作成が失敗するため、重複を確認できるよう部分索引でなく
-- 単純な UNIQUE を貼る。重複データはアプリ運用前提でない（デモ/本番とも未生成）。
ALTER TABLE public.owner_remittances
  DROP CONSTRAINT IF EXISTS owner_remittances_owner_month_unique;
ALTER TABLE public.owner_remittances
  ADD CONSTRAINT owner_remittances_owner_month_unique
    UNIQUE (company_id, owner_id, remittance_month);

-- ------------------------------------------------------------
-- 5. sent/confirmed 後は金額系カラムの変更を禁止
--    （送金確定後に元データが変わっても内訳がブレないようにロック）
--    notes と status の前進（confirmed→sent 等）は許可する。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lock_sent_remittance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- draft のうちは自由に編集できる
  IF OLD.status = 'draft' THEN
    RETURN NEW;
  END IF;

  -- confirmed / sent では金額系の改変を拒否する
  IF NEW.total_rent             IS DISTINCT FROM OLD.total_rent
     OR NEW.management_fee_deducted IS DISTINCT FROM OLD.management_fee_deducted
     OR NEW.management_fee_tax  IS DISTINCT FROM OLD.management_fee_tax
     OR NEW.expense_deducted    IS DISTINCT FROM OLD.expense_deducted
     OR NEW.net_amount          IS DISTINCT FROM OLD.net_amount
     OR NEW.owner_bill_amount   IS DISTINCT FROM OLD.owner_bill_amount
     OR NEW.manual_net_amount   IS DISTINCT FROM OLD.manual_net_amount
     OR NEW.manual_override     IS DISTINCT FROM OLD.manual_override
  THEN
    RAISE EXCEPTION '確定済み（%）の送金は金額を変更できません。先に draft に戻してください', OLD.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- status を draft へ巻き戻すのは許可（やり直し用）
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_sent_remittance_trg ON public.owner_remittances;
CREATE TRIGGER lock_sent_remittance_trg
  BEFORE UPDATE ON public.owner_remittances
  FOR EACH ROW EXECUTE FUNCTION public.lock_sent_remittance();

COMMIT;
