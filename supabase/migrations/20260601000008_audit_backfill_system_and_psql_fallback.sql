-- 監査ログ: NULL の user_id を再度システム実行として埋め直し、
-- かつ「PostgREST を通らない経路（マイグレーション / Management API の database/query 直叩き）」でも
-- システム実行として記録されるようにトリガーを補強する。
--
-- 背景:
--   20260601000001 で既存 NULL を SYSTEM_USER_ID に埋めたが、その後も NULL が再発した。
--   調査の結果、NULL の発生源は全て PostgREST を通らない経路だった:
--     1. デモ会社の週次リセット cron（reset-demo）が Management API の database/query で生SQLを実行
--     2. 通常のマイグレーション（例: drop_overdue_status の rent_billings 一括 UPDATE）
--   これらの経路では log_audit() が request.headers も auth.uid() も拾えず user_id=NULL になる。
--   本物のユーザー操作で user_id が欠落した行は一件も無いことを確認済み（全行がデモ会社 or
--   マイグレーションによる正規化 UPDATE）。
--
-- 対策:
--   A) reset-demo 側は生成SQL先頭で `SET LOCAL request.headers` に SYSTEM_USER_ID を仕込む
--      （アプリコード generate-sql.ts で対応済み）。
--   B) マイグレーション等、ヘッダーを仕込めない直接SQL経路向けに、トリガー側で
--      「request.headers も auth.uid() も無い＝サーバー直接実行」と判定できた場合は
--      SYSTEM_USER_ID にフォールバックする。これで以後のマイグレーションも NULL を残さない。

-- 1) 既存の NULL 行を SYSTEM_USER_ID で埋め直す
UPDATE public.audit_logs
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id IS NULL;

-- 2) log_audit() を更新: PostgREST 非経由の直接SQL実行も「システム」として記録する
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

  -- request.headers GUC を読む。PostgREST 経由なら（ヘッダー未付与でも）この GUC は
  -- 存在し、直接SQL経路（マイグレーション / Management API の database/query）では未設定。
  -- この「GUC が存在するか否か」で PostgREST 経由かサーバー直接実行かを切り分ける。
  v_headers := current_setting('request.headers', true)::jsonb; -- 未設定なら NULL

  -- 1) request.headers から X-Actor-Id を読む
  --    (api route で service_role 利用時、または reset-demo が SET LOCAL で明示付与)
  v_actor_id := v_headers->>'x-actor-id';
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

  -- 3) ここまで NULL かつ request.headers GUC 自体が存在しない場合のみ、
  --    PostgREST を通らない直接SQL経路（マイグレーション / Management API query）と判定し、
  --    システム実行として SYSTEM_USER_ID を入れる。
  --    PostgREST 経由（v_headers IS NOT NULL）で操作者が取れなかった場合は、
  --    anon/未認証など「操作者が本当に不明」なケースなので NULL のまま残す。
  IF v_user_id IS NULL AND v_headers IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000001';
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
