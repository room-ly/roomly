-- 監査ログ: 「中身に変化がなければスキップ」する除外条件を撤廃する。
--
-- 背景:
--   UPDATE文が実行されたが OLD と NEW で updated_at 以外に差分が無い場合、
--   これまでログを残さない仕様だった。
--   しかし入金登録などで「実際にユーザーが操作したのに更新履歴が出ない」事象が発生。
--   原因: 同一トランザクション内の連続UPDATE等で、見かけ上 status が unpaid→paid
--   に変わったように見えても、実DBの OLD.status が既に 'paid' のケースがあり、
--   結果として audit_logs に行が残らない。
--
-- 方針:
--   UI/UX上「ユーザーが何をしたか」を残したい。updated_at だけ動いた行も含めて
--   常に記録する。差分計算側（AuditLogSection の computeDiffs）が表示時に
--   updated_at 等のノイズを除外するので、テーブル肥大はあるが視覚ノイズは出ない。

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
  v_headers jsonb;
  v_actor_id text;
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
    -- 除外条件は撤廃。updated_at だけ動いた行も残し、UI側で表示制御する。
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_record_id := OLD.id;
    v_company_id := OLD.company_id;
    v_before := to_jsonb(OLD);
    v_after := NULL;
  END IF;

  BEGIN
    v_headers := current_setting('request.headers', true)::jsonb;
    v_actor_id := v_headers->>'x-actor-id';
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  IF v_actor_id IS NOT NULL AND v_actor_id <> '' THEN
    BEGIN
      v_user_id := v_actor_id::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      v_user_id := NULL;
    END;
  END IF;

  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

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
