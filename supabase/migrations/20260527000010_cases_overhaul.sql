-- 対応案件統合: maintenance_requests + inquiries → cases
--
-- 設計:
--   1. maintenance_requests を cases にリネーム（データ無傷）
--   2. maintenance_logs を case_logs にリネーム、request_id → case_id
--   3. expenses.maintenance_request_id を expenses.case_id にリネーム
--   4. inquiries / inquiry_logs を DROP（既存データはデモのみで再シードする）
--   5. cases.property_id を NOT NULL → NULL許可（クレーム・近隣対応など物件特定不可ケース対応）
--   6. cases.category enum 拡張、status の waiting_parts → on_hold に統合
--   7. cases.source に 'portal' を許可

-- ============================================
-- 1) inquiries の外部キー削除 → テーブル削除
-- ============================================
ALTER TABLE IF EXISTS public.inquiries DROP CONSTRAINT IF EXISTS inquiries_linked_maintenance_id_fkey;
ALTER TABLE IF EXISTS public.inquiries DROP CONSTRAINT IF EXISTS inquiries_linked_move_out_request_id_fkey;
DROP TABLE IF EXISTS public.inquiry_logs CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;

-- ============================================
-- 2) maintenance_requests → cases リネーム
-- ============================================
ALTER TABLE public.maintenance_requests RENAME TO cases;

-- PK制約名・FK制約名・トリガ名はテーブルリネームでも自動更新されないので明示的に張り替える
ALTER TABLE public.cases RENAME CONSTRAINT maintenance_requests_pkey TO cases_pkey;
ALTER TABLE public.cases RENAME CONSTRAINT maintenance_requests_company_id_fkey TO cases_company_id_fkey;
ALTER TABLE public.cases RENAME CONSTRAINT maintenance_requests_payee_id_fkey TO cases_payee_id_fkey;
ALTER TABLE public.cases RENAME CONSTRAINT maintenance_requests_property_id_fkey TO cases_property_id_fkey;
ALTER TABLE public.cases RENAME CONSTRAINT maintenance_requests_tenant_id_fkey TO cases_tenant_id_fkey;
ALTER TABLE public.cases RENAME CONSTRAINT maintenance_requests_unit_id_fkey TO cases_unit_id_fkey;

-- インデックスをリネーム
ALTER INDEX IF EXISTS public.idx_maintenance_company RENAME TO idx_cases_company;
ALTER INDEX IF EXISTS public.idx_maintenance_payee RENAME TO idx_cases_payee;
ALTER INDEX IF EXISTS public.idx_maintenance_requests_status RENAME TO idx_cases_status_dup;
ALTER INDEX IF EXISTS public.idx_maintenance_requests_unit_id RENAME TO idx_cases_unit_id;
ALTER INDEX IF EXISTS public.idx_maintenance_status RENAME TO idx_cases_status;

-- RLSポリシーを張り替え（古いポリシー削除→新規作成）
DROP POLICY IF EXISTS maintenance_requests_tenant_policy ON public.cases;
DROP POLICY IF EXISTS maintenance_tenant_insert ON public.cases;
DROP POLICY IF EXISTS maintenance_tenant_select ON public.cases;

CREATE POLICY cases_tenant_policy ON public.cases
  USING (company_id = public.company_id());

CREATE POLICY cases_tenant_insert ON public.cases
  FOR INSERT WITH CHECK (
    public.user_type() = 'tenant'::text
    AND tenant_id = public.tenant_id()
    AND company_id = public.company_id()
  );

CREATE POLICY cases_tenant_select ON public.cases
  FOR SELECT USING (
    public.user_type() = 'tenant'::text
    AND tenant_id = public.tenant_id()
  );

-- property_id を NULL許可に変更（物件特定不可な案件用）
ALTER TABLE public.cases ALTER COLUMN property_id DROP NOT NULL;

-- ============================================
-- 3) maintenance_logs → case_logs リネーム
-- ============================================
ALTER TABLE public.maintenance_logs RENAME TO case_logs;
ALTER TABLE public.case_logs RENAME COLUMN request_id TO case_id;

ALTER TABLE public.case_logs RENAME CONSTRAINT maintenance_logs_pkey TO case_logs_pkey;
ALTER TABLE public.case_logs RENAME CONSTRAINT maintenance_logs_company_id_fkey TO case_logs_company_id_fkey;
ALTER TABLE public.case_logs RENAME CONSTRAINT maintenance_logs_request_id_fkey TO case_logs_case_id_fkey;
ALTER TABLE public.case_logs RENAME CONSTRAINT maintenance_logs_user_id_fkey TO case_logs_user_id_fkey;

ALTER INDEX IF EXISTS public.idx_maintenance_logs_request_id RENAME TO idx_case_logs_case_id;

DROP POLICY IF EXISTS maintenance_logs_tenant_policy ON public.case_logs;
CREATE POLICY case_logs_tenant_policy ON public.case_logs
  USING (company_id = public.company_id());

-- ============================================
-- 4) expenses.maintenance_request_id → case_id リネーム
-- ============================================
ALTER TABLE public.expenses RENAME COLUMN maintenance_request_id TO case_id;
ALTER TABLE public.expenses RENAME CONSTRAINT expenses_maintenance_request_id_fkey TO expenses_case_id_fkey;
ALTER INDEX IF EXISTS public.idx_expenses_maintenance RENAME TO idx_expenses_case;

-- ============================================
-- 5) 既存データのステータス・カテゴリを新enumに正規化
-- ============================================
-- waiting_parts → on_hold（部品待ちは保留に統合）
UPDATE public.cases SET status = 'on_hold' WHERE status = 'waiting_parts';

-- ============================================
-- 6) source に 'portal' 許可（既存はチェック制約なしのtext。明示的なCHECKは付けない方針を踏襲）
-- ============================================
-- 既存設計でcategory/status/sourceにCHECK制約はない。アプリ層のzodで検証する方針を維持

COMMENT ON TABLE public.cases IS '対応案件: 設備修繕・鍵対応・クレーム・問い合わせ等、管理会社が認知した全事象のログ';
COMMENT ON COLUMN public.cases.category IS 'repair|key|common_area|tenant_trouble|neighbor|inspection|inquiry|request|complaint|other';
COMMENT ON COLUMN public.cases.status IS 'open|in_progress|on_hold|completed|cancelled';
COMMENT ON COLUMN public.cases.source IS 'admin|tenant|portal';
COMMENT ON TABLE public.case_logs IS '対応案件の対応履歴ログ';
