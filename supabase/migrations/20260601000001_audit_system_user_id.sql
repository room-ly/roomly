-- 監査ログ: cron / system 起点の操作を識別するため、固定UUIDを「システム」として記録する。
--
-- 背景:
--   これまで cron 経由（rent-billings/notifications/email-followup）で書き込まれた
--   audit_logs.user_id は NULL になっていた。NULL では「user_id 付与漏れ」と
--   「システム実行」の区別ができないため、固定UUIDで明示する。
--
-- 方針:
--   - SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001' を予約値とする
--   - アプリ側の createAdminClient(SYSTEM_USER_ID) で X-Actor-Id ヘッダー経由で
--     log_audit() が拾い、user_id に記録する
--   - audit-logs API はこのIDを users JOIN せず「システム」として表示する
--   - 既存の NULL 行は全て cron 起点とみなして SYSTEM_USER_ID に埋める

-- 1) auth.users への外部キーを外す。
--    user_id は「記録時点の操作者識別子」として扱い、auth.users から削除されても
--    ログには元のIDを残す（監査ログとしてはその方が正しい）。
--    また SYSTEM_USER_ID のような auth.users に存在しない固定UUIDを格納できるようにする。
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- 2) 既存の NULL 行（cron 起点）を SYSTEM_USER_ID で埋める
UPDATE public.audit_logs
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id IS NULL;
