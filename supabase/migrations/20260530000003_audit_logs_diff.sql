-- 監査ログに差分（before_values / after_values）を保存できるよう拡張する。
-- UPDATE: before=OLD全体、after=NEW全体
-- INSERT: before=NULL、after=NEW全体
-- DELETE: before=OLD全体、after=NULL

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS before_values jsonb,
  ADD COLUMN IF NOT EXISTS after_values jsonb;

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
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_record_id := NEW.id;
    v_company_id := NEW.company_id;
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    -- 中身に変化がなければログを残さない（updated_atだけ動いたケースを除外）
    IF v_before - 'updated_at' = v_after - 'updated_at' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_record_id := OLD.id;
    v_company_id := OLD.company_id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  v_user_id := auth.uid();

  INSERT INTO public.audit_logs (
    company_id, table_name, record_id, action, user_id,
    before_values, after_values
  )
  VALUES (
    v_company_id, TG_TABLE_NAME, v_record_id, v_action, v_user_id,
    v_before, v_after
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
