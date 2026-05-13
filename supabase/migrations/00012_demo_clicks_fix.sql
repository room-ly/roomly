-- demo_clicksテーブルにprojectカラム追加 + anon INSERT用RLSポリシー

ALTER TABLE demo_clicks ADD COLUMN IF NOT EXISTS project text NOT NULL DEFAULT 'roomly';

-- anon roleからのINSERTを許可（公開HPからのクリックトラッキング用）
CREATE POLICY "anon_insert_demo_clicks" ON demo_clicks
  FOR INSERT TO anon
  WITH CHECK (true);
