-- 分析用Viewはservice_role経由（管理画面のadmin機能）からのみ参照する想定。
-- ViewはRLSを直接持てないため、anon/authenticatedからSELECT権限を剥奪して保護する。
-- これによりSupabase Dashboard上の "UNRESTRICTED" バッジによる露出リスクを解消する。

revoke select on public.v_login_daily from anon, authenticated;
revoke select on public.v_login_by_geo from anon, authenticated;
revoke select on public.v_login_by_source from anon, authenticated;
revoke select on public.v_signup_funnel from anon, authenticated;
revoke select on public.v_signup_attribution from anon, authenticated;
revoke select on public.v_signup_by_geo from anon, authenticated;
