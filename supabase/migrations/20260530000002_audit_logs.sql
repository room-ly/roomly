-- 監査ログ
-- 主要テーブルの INSERT/UPDATE/DELETE を自動記録する。
-- 軽量設計: テーブル名、record_id、操作種別、ユーザーID、タイムスタンプのみ。
-- 差分（before/after）は保持しない。

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_company_table_record_idx
  ON public.audit_logs (company_id, table_name, record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx
  ON public.audit_logs (company_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 同じ会社のメンバーのみ閲覧可能
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  USING (company_id = public.company_id());

-- 書き込みはトリガーから（service_role経由）のみ。アプリからの直接書き込みは不可
-- ユーザーロールでINSERTポリシーを作らない=拒否される

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- 監査ログ記録用トリガー関数
-- 各監査対象テーブルにこのトリガーを付与する
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_record_id uuid;
  v_action text;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_record_id := OLD.id;
    v_company_id := OLD.company_id;
  END IF;

  -- auth.uid() は service role 経由（admin API）の場合は NULL になる
  -- その場合は user_id を null のまま保存する
  v_user_id := auth.uid();

  INSERT INTO public.audit_logs (company_id, table_name, record_id, action, user_id)
  VALUES (v_company_id, TG_TABLE_NAME, v_record_id, v_action, v_user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 監査対象テーブルにトリガーを付与
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'properties', 'units', 'tenants', 'contracts',
    'rent_billings', 'rent_payments', 'cases',
    'expenses', 'owners', 'owner_remittances',
    'payees'
  ];
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
