-- reset_demo_data() SQL関数を廃止する。
--
-- 背景:
--   この関数は cases_overhaul / expenses_full_overhaul 以降のスキーマ変更に追従できておらず、
--   呼び出すたびにエラーで失敗する状態だった。
--   Edge Function `reset-demo-data` も実態として動作していなかった可能性が高い。
--
-- 移行先:
--   kanri/src/app/api/cron/reset-demo/route.ts に置き換え。
--   - TS の seed-data.ts に固定データを定義（TablesInsert<> で型保証）
--   - generate-sql.ts で SQL を組み立て、Management API で1発実行
--   - Vercel cron が週次（月曜0:00 JST）で叩く
--   - 失敗時はメール通知（CRON_FAILURE_ALERT_EMAIL）
--   - ユニットテスト generate-sql.test.ts が CI で毎回走る
--
-- これにより、スキーマ変更時の関数メンテ漏れによるサイレント失敗を構造的に防ぐ。

DROP FUNCTION IF EXISTS public.reset_demo_data(uuid);
