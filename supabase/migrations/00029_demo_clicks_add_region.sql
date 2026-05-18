-- demo_clicksテーブルにregion（都道府県）カラム追加
ALTER TABLE demo_clicks ADD COLUMN IF NOT EXISTS region text DEFAULT '';
