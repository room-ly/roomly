-- 監査ログ: service_role 経由の書き込みで actor_user_id を記録できるようにする。
--
-- 背景:
--   現在の log_audit() は auth.uid() のみ参照しているため、API Route が
--   service_role キーで書き込むと user_id が NULL になる。
--   anon キー + ユーザーJWTで書く処理（クライアント直叩き）は user_id が入る。
--
-- 方針（ベストプラクティス）:
--   PostgREST はリクエストごとに request.headers GUC を公開している。
--   API Route 側で Supabase JS の global.headers に X-Actor-Id を仕込めば、
--   トリガー関数からそのヘッダーを読んで actor_user_id として記録できる。
--   set_config を別RPCで呼ぶ方式はトランザクション境界の都合で機能しない。
--
--   優先順位:
--     1) request.headers から X-Actor-Id ヘッダーを読む
--     2) auth.uid()（anonキー＋ユーザーJWT経由の通常書き込み）
--     3) どちらも無ければ NULL（cron / system）

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

  -- 1) PostgREST が公開する request.headers から X-Actor-Id を読む
  --    (api routeで service_role 利用時に明示的に付与)
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

  -- 2) ヘッダーで取れなければ auth.uid()（クライアント直叩きや SSR ユーザーJWT経由）
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;

  -- 3) どちらも無ければ NULL のまま（cron / system 経由）

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
