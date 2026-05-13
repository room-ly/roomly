-- authenticatedロールからのdemo_clicks INSERT許可（デモログイン時のトラッキング用）
CREATE POLICY "authenticated_insert_demo_clicks" ON demo_clicks
  FOR INSERT TO authenticated
  WITH CHECK (true);
