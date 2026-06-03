-- アパートローン機能（拡張機能・デフォルトOFF）
--
-- 設計方針:
--   - ローンは loans テーブルに独立して持つ
--   - ローン⇔物件は多対多（共同担保・複数棟一括ローン・本体+リフォーム等に対応）
--   - 返済予定表（償還予定表）を loan_repayments に展開。取込/手動どちらも可
--   - 銀行APIは制度上ローン残高を取得できないため使わない。返済予定表取込＋手動編集で完結
--   - companies.loan_feature_enabled = false を「ローン機能OFF」とするインラインOFFトグル方式
--     （稟議・経費承認と同じ思想。デフォルトOFF、必要な会社だけON）

-- ============================================================
-- 拡張機能トグル
-- ============================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS loan_feature_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.companies.loan_feature_enabled IS
  'アパートローン機能のON/OFF。false（デフォルト）のときローン機能OFF。自社所有物件を持つ会社・個人大家のみONにする拡張機能';

-- ============================================================
-- loans: ローン本体
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- 借入元（任意で owner に紐付け。オーナーレポートのCF計算に使う）
  owner_id uuid REFERENCES public.owners(id) ON DELETE SET NULL,
  name text NOT NULL,                       -- ローン名称（例: アップス新宿ビル アパートローン）
  lender_name text NOT NULL,                -- 借入先金融機関名
  loan_number text,                         -- 証書番号・お客様番号等
  -- 借入条件
  principal_amount numeric(12,0) NOT NULL,  -- 当初借入元本（円）
  interest_rate numeric(6,4),               -- 金利（年率%。例: 1.8750）
  interest_type text NOT NULL DEFAULT 'fixed'
    CHECK (interest_type IN ('fixed', 'variable')),  -- 固定/変動
  repayment_method text NOT NULL DEFAULT 'equal_principal_and_interest'
    CHECK (repayment_method IN ('equal_principal_and_interest', 'equal_principal')),  -- 元利均等/元金均等
  term_months integer,                      -- 返済期間（月数）
  disbursement_date date,                   -- 実行日（借入日）
  first_payment_date date,                  -- 初回返済日
  final_payment_date date,                  -- 最終返済日
  payment_day integer CHECK (payment_day BETWEEN 1 AND 31),  -- 毎月の返済日
  -- 銀行引落口座（任意。company_bank_accounts と無理に紐付けず文字列で持つ）
  bank_account_label text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'refinanced')),  -- 返済中/完済/借換
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.loans OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_loans_company ON public.loans USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_loans_owner ON public.loans USING btree (owner_id);

COMMENT ON TABLE public.loans IS 'アパートローン本体。物件とは loan_properties で多対多';

-- ============================================================
-- loan_properties: ローン⇔物件 多対多（按分比率付き）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loan_properties (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  -- 共同担保・複数棟一括ローンで物件ごとのCF按分に使う（合計100%想定だが強制はしない）
  allocation_ratio numeric(5,2),            -- 按分比率（%）。NULL可
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (loan_id, property_id)
);

ALTER TABLE public.loan_properties OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_loan_properties_company ON public.loan_properties USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_loan_properties_loan ON public.loan_properties USING btree (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_properties_property ON public.loan_properties USING btree (property_id);

COMMENT ON TABLE public.loan_properties IS 'ローンと物件の多対多。共同担保・複数棟一括ローンに対応。allocation_ratioで物件ごとのCF按分';

-- ============================================================
-- loan_repayments: 返済予定表（償還予定表）= 毎月の明細
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  installment_no integer,                   -- 回数（第N回）
  payment_date date NOT NULL,               -- 返済日
  principal_amount numeric(12,0) NOT NULL DEFAULT 0,  -- 元金
  interest_amount numeric(12,0) NOT NULL DEFAULT 0,   -- 利息
  total_amount numeric(12,0)
    GENERATED ALWAYS AS (principal_amount + interest_amount) STORED,  -- 返済額
  balance_after numeric(12,0),              -- 返済後残高
  -- 区分: 予定 / 繰上返済 / 金利改定で再計算された行 など
  entry_type text NOT NULL DEFAULT 'scheduled'
    CHECK (entry_type IN ('scheduled', 'prepayment', 'adjustment')),
  -- 入力元: 取込 / 手動。手動編集された取込行は manual に倒す
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('imported', 'manual')),
  -- 実績照合（将来の入出金明細アグリゲーション連携用。今はNULL=未照合）
  is_paid boolean NOT NULL DEFAULT false,
  paid_at date,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.loan_repayments OWNER TO postgres;
CREATE INDEX IF NOT EXISTS idx_loan_repayments_company ON public.loan_repayments USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON public.loan_repayments USING btree (loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_date ON public.loan_repayments USING btree (loan_id, payment_date);

COMMENT ON TABLE public.loan_repayments IS '返済予定表（償還予定表）の各行。取込/手動編集どちらも可。is_paidは将来の実績照合用';

-- ============================================================
-- updated_at トリガー
-- ============================================================
CREATE OR REPLACE TRIGGER set_updated_at BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER set_updated_at BEFORE UPDATE ON public.loan_repayments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS（テナント分離）
-- ============================================================
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY loans_tenant_policy ON public.loans
  USING (company_id = public.company_id());
CREATE POLICY loan_properties_tenant_policy ON public.loan_properties
  USING (company_id = public.company_id());
CREATE POLICY loan_repayments_tenant_policy ON public.loan_repayments
  USING (company_id = public.company_id());

-- ============================================================
-- 監査ログトリガー
-- ============================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['loans', 'loan_properties', 'loan_repayments'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_log_trigger ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_log_trigger
       AFTER INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.log_audit()',
      t
    );
  END LOOP;
END $$;
