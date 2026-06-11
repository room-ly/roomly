-- 振込バッチ（payment_batches）
--
-- 設計方針:
--   - 「振り込むもの」(オーナー送金 + 業者への費用支払い)を1つのバッチにまとめる
--   - バッチ = 1回の振込の束。同じ振込日に複数バッチOK(午前/午後等)。UNIQUE制約は付けない
--   - 明細(payment_batch_items)は受取人の口座情報をスナップショット保存し、後で口座が
--     変わっても「その時いくらをどこへ振り込んだか」の履歴が崩れないようにする
--   - status: draft(編集中・CSV再出力可) / executed(振込実行済み)。2状態に簡素化
--   - executed 確定時に owner_remittances.status='sent'/sent_date, expenses.paid_at を記録
--   - 全銀フォーマットの振込指定日は希望日。実際の予約実行は銀行側に委ねる(batch_dateは管理用)
--   詳細: kanri/docs/payment-batches-design.md

-- ============================================================
-- payment_batches: 振込の束(実行単位)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_batches (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_date date NOT NULL,                 -- 振込実行(予定)日。CSVヘッダの振込指定日にも使う
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'executed')),
  total_amount numeric(12,0) NOT NULL DEFAULT 0,  -- 明細合計(集計値)
  sender_account_id uuid REFERENCES public.company_bank_accounts(id) ON DELETE SET NULL,  -- 振込元口座
  notes text,
  executed_at timestamptz,                  -- 振込実行済みに確定した日時
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_batches OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_payment_batches_company ON public.payment_batches USING btree (company_id, batch_date DESC);
COMMENT ON TABLE public.payment_batches IS '振込バッチ(実行単位)。オーナー送金と業者支払いを混在で含む。draft→executedで送金/費用に支払済みを連動記録';

-- ============================================================
-- payment_batch_items: バッチ明細(1振込行)
--   item_type に応じて owner_remittance_id か expense_id のどちらか一方を持つ
--   口座情報は実行時点のスナップショット
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_batch_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payment_batch_id uuid NOT NULL REFERENCES public.payment_batches(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('owner_remittance', 'expense')),
  owner_remittance_id uuid REFERENCES public.owner_remittances(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  -- 受取人スナップショット
  recipient_name text NOT NULL,
  bank_code text NOT NULL,
  branch_code text NOT NULL,
  account_type text NOT NULL DEFAULT 'ordinary',
  account_number text NOT NULL,
  account_holder_kana text NOT NULL,
  amount numeric(12,0) NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- item_type と link の整合性
  CONSTRAINT payment_batch_items_link_check CHECK (
    (item_type = 'owner_remittance' AND owner_remittance_id IS NOT NULL AND expense_id IS NULL)
    OR (item_type = 'expense' AND expense_id IS NOT NULL AND owner_remittance_id IS NULL)
  )
);
ALTER TABLE public.payment_batch_items OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_payment_batch_items_company ON public.payment_batch_items USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_payment_batch_items_batch ON public.payment_batch_items USING btree (payment_batch_id);
-- 候補除外クエリ(draftバッチに既に入っているものは拾わない)で使う
CREATE INDEX IF NOT EXISTS idx_payment_batch_items_remittance ON public.payment_batch_items USING btree (owner_remittance_id) WHERE owner_remittance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_batch_items_expense ON public.payment_batch_items USING btree (expense_id) WHERE expense_id IS NOT NULL;
COMMENT ON TABLE public.payment_batch_items IS 'バッチ明細。オーナー送金/費用のどちらか1件に紐付き、口座情報はスナップショット保持';

-- ============================================================
-- updated_at トリガ
-- ============================================================
CREATE OR REPLACE TRIGGER set_updated_at BEFORE UPDATE ON public.payment_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- executed 後はロック(明細の改変・金額変更を禁止)。status を draft へ戻すのは許可
-- ============================================================
CREATE OR REPLACE FUNCTION public.lock_executed_payment_batch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'draft' THEN
    RETURN NEW;
  END IF;
  -- executed では金額系の改変を拒否(notes と status の draft 巻き戻しは許可)
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.batch_date IS DISTINCT FROM OLD.batch_date
     OR NEW.sender_account_id IS DISTINCT FROM OLD.sender_account_id
  THEN
    RAISE EXCEPTION '実行済みの振込バッチは変更できません。先に draft に戻してください'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_executed_payment_batch_trg ON public.payment_batches;
CREATE TRIGGER lock_executed_payment_batch_trg
  BEFORE UPDATE ON public.payment_batches
  FOR EACH ROW EXECUTE FUNCTION public.lock_executed_payment_batch();

-- executed バッチの明細は削除・改変禁止(draftバッチの明細は自由)
CREATE OR REPLACE FUNCTION public.lock_executed_batch_items()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  batch_status text;
  target_batch uuid;
BEGIN
  target_batch := COALESCE(NEW.payment_batch_id, OLD.payment_batch_id);
  SELECT status INTO batch_status FROM public.payment_batches WHERE id = target_batch;
  -- バッチ本体ごと消える(CASCADE)場合は batch_status が NULL になり得る → 許可
  IF batch_status = 'executed' THEN
    RAISE EXCEPTION '実行済みバッチの明細は変更できません'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS lock_executed_batch_items_trg ON public.payment_batch_items;
CREATE TRIGGER lock_executed_batch_items_trg
  BEFORE INSERT OR UPDATE OR DELETE ON public.payment_batch_items
  FOR EACH ROW EXECUTE FUNCTION public.lock_executed_batch_items();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_batches_tenant_policy ON public.payment_batches
  USING (company_id = public.company_id());
CREATE POLICY payment_batch_items_tenant_policy ON public.payment_batch_items
  USING (company_id = public.company_id());

-- ============================================================
-- 監査ログtrigger
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['payment_batches', 'payment_batch_items'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_log_trigger ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_log_trigger
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_audit()', t);
  END LOOP;
END $$;
