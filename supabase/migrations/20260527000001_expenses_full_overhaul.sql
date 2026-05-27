-- ============================================================
-- 経費機能 全部入り化
--   1. companies.expense_approval_threshold
--   2. properties.default_allocation_method
--   3. expenses: 3分割 / status / 税区分 / 支払日 / 修繕紐付 / 承認情報
--   4. expense_allocations
--   5. deposit_transactions
--   6. 既存データ移行 (is_owner_charge → owner_amount/company_amount)
--   7. RLS / index
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. companies: 承認しきい値
-- ------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS expense_approval_threshold numeric(10,0) DEFAULT 50000 NOT NULL;

COMMENT ON COLUMN public.companies.expense_approval_threshold IS
  'オーナー承認が必須となる経費金額のしきい値。amount >= 値 かつ owner_amount > 0 の経費は pending_approval に遷移';

-- ------------------------------------------------------------
-- 2. properties: デフォルト按分方法
-- ------------------------------------------------------------
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS default_allocation_method text DEFAULT 'equal_units' NOT NULL;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_default_allocation_method_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_default_allocation_method_check
    CHECK (default_allocation_method IN ('equal_units', 'by_floor_area', 'by_owner_share', 'custom'));

COMMENT ON COLUMN public.properties.default_allocation_method IS
  '共用部経費の按分デフォルト: equal_units=戸数均等 / by_floor_area=床面積 / by_owner_share=オーナー持分 / custom=都度指定';

-- ------------------------------------------------------------
-- 3. expenses: カラム拡張
-- ------------------------------------------------------------
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS owner_amount   numeric(10,0) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS tenant_amount  numeric(10,0) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS company_amount numeric(10,0) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' NOT NULL,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS tax_category text DEFAULT 'taxable' NOT NULL,
  ADD COLUMN IF NOT EXISTS payment_due_date date,
  ADD COLUMN IF NOT EXISTS paid_at date,
  ADD COLUMN IF NOT EXISTS maintenance_request_id uuid REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL;

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_status_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_status_check
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'completed', 'paid'));

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_tax_category_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_tax_category_check
    CHECK (tax_category IN ('taxable', 'tax_free', 'non_taxable'));

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_amount_nonneg_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_amount_nonneg_check
    CHECK (owner_amount >= 0 AND tenant_amount >= 0 AND company_amount >= 0);

-- ------------------------------------------------------------
-- 4. 既存データ移行（CHECK追加より前に実施）
-- ------------------------------------------------------------
UPDATE public.expenses
   SET owner_amount   = CASE WHEN is_owner_charge THEN amount ELSE 0 END,
       tenant_amount  = 0,
       company_amount = CASE WHEN is_owner_charge THEN 0 ELSE amount END
 WHERE owner_amount = 0 AND tenant_amount = 0 AND company_amount = 0;

-- 合計整合 CHECK（既存データ移行が済んだので即時 VALIDATE 可）
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_amount_split_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_amount_split_check
    CHECK (owner_amount + tenant_amount + company_amount = amount);

-- tenant_amount > 0 の場合は contract_id 必須
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_tenant_requires_contract;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_tenant_requires_contract
    CHECK (tenant_amount = 0 OR contract_id IS NOT NULL);

-- is_owner_charge は次マイグレーションで DROP。ここでは NOT NULL/DEFAULT 解除のみ
ALTER TABLE public.expenses ALTER COLUMN is_owner_charge DROP NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN is_owner_charge DROP DEFAULT;

-- ------------------------------------------------------------
-- 5. expense_allocations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  unit_id  uuid REFERENCES public.units(id)  ON DELETE SET NULL,
  owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  owner_amount   numeric(10,0) DEFAULT 0 NOT NULL,
  tenant_amount  numeric(10,0) DEFAULT 0 NOT NULL,
  company_amount numeric(10,0) DEFAULT 0 NOT NULL,
  amount         numeric(10,0) DEFAULT 0 NOT NULL,
  share_ratio    numeric(8,5),
  allocation_method text NOT NULL DEFAULT 'custom',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expense_alloc_target_check
    CHECK ((unit_id IS NOT NULL) OR (owner_id IS NOT NULL)),
  CONSTRAINT expense_alloc_method_check
    CHECK (allocation_method IN ('equal_units','by_floor_area','by_owner_share','custom')),
  CONSTRAINT expense_alloc_amount_check
    CHECK (owner_amount + tenant_amount + company_amount = amount),
  CONSTRAINT expense_alloc_nonneg_check
    CHECK (owner_amount >= 0 AND tenant_amount >= 0 AND company_amount >= 0)
);

ALTER TABLE public.expense_allocations OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_expense_alloc_expense ON public.expense_allocations(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_alloc_unit    ON public.expense_allocations(unit_id);
CREATE INDEX IF NOT EXISTS idx_expense_alloc_owner   ON public.expense_allocations(owner_id);
CREATE INDEX IF NOT EXISTS idx_expense_alloc_company ON public.expense_allocations(company_id);

ALTER TABLE public.expense_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expense_allocations_tenant_policy ON public.expense_allocations;
CREATE POLICY expense_allocations_tenant_policy ON public.expense_allocations
  USING (company_id = public.company_id())
  WITH CHECK (company_id = public.company_id());

DROP TRIGGER IF EXISTS set_updated_at ON public.expense_allocations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.expense_allocations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT ALL ON TABLE public.expense_allocations TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 6. deposit_transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deposit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  expense_id  uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  billing_id  uuid REFERENCES public.rent_billings(id) ON DELETE SET NULL,
  amount numeric(10,0) NOT NULL,
  transaction_type text NOT NULL,
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deposit_tx_type_check
    CHECK (transaction_type IN ('initial_deposit','charge','refund','additional_billing')),
  CONSTRAINT deposit_tx_amount_pos CHECK (amount > 0)
);

ALTER TABLE public.deposit_transactions OWNER TO postgres;

CREATE INDEX IF NOT EXISTS idx_deposit_tx_contract  ON public.deposit_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_expense   ON public.deposit_transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_company   ON public.deposit_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_occurred  ON public.deposit_transactions(occurred_at);

ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deposit_transactions_tenant_policy ON public.deposit_transactions;
CREATE POLICY deposit_transactions_tenant_policy ON public.deposit_transactions
  USING (company_id = public.company_id())
  WITH CHECK (company_id = public.company_id());

DROP POLICY IF EXISTS deposit_transactions_tenant_user_select ON public.deposit_transactions;
CREATE POLICY deposit_transactions_tenant_user_select ON public.deposit_transactions
  FOR SELECT
  USING (
    public.user_type() = 'tenant'
    AND contract_id IN (
      SELECT id FROM public.contracts WHERE tenant_id = public.tenant_id()
    )
  );

GRANT ALL ON TABLE public.deposit_transactions TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 7. インデックス追加
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_expenses_status            ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_contract          ON public.expenses(contract_id);
CREATE INDEX IF NOT EXISTS idx_expenses_maintenance       ON public.expenses(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_due       ON public.expenses(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_company_status    ON public.expenses(company_id, status);

-- ------------------------------------------------------------
-- 8. 入居者ポータル: 自分の負担分の経費を閲覧
-- ------------------------------------------------------------
DROP POLICY IF EXISTS expenses_tenant_user_select ON public.expenses;
CREATE POLICY expenses_tenant_user_select ON public.expenses
  FOR SELECT
  USING (
    public.user_type() = 'tenant'
    AND tenant_amount > 0
    AND contract_id IN (
      SELECT id FROM public.contracts WHERE tenant_id = public.tenant_id()
    )
  );

COMMIT;
