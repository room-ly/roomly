-- notifications テーブルの RLS を user_id 対応にする。
-- 既存ポリシーは company_id のみで判定していたため、user_id 指定の個人宛通知も全社員から見えていた。
-- 仕様: user_id が NULL（全社員宛）か、または auth.uid() と一致するレコードだけ可視。

BEGIN;

DROP POLICY IF EXISTS notifications_tenant_policy ON public.notifications;

CREATE POLICY notifications_tenant_select ON public.notifications
  FOR SELECT
  USING (
    company_id = public.company_id()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- INSERT/UPDATE/DELETE は会社境界のみで制御（サーバー側でしかINSERTしない想定。
-- UPDATEは既読化（PUT /api/notifications）で利用する）
CREATE POLICY notifications_tenant_write ON public.notifications
  FOR ALL
  USING (company_id = public.company_id())
  WITH CHECK (company_id = public.company_id());

COMMIT;
