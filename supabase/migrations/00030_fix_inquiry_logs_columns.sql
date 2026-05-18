-- inquiry_logsテーブルのカラムをアプリケーションコードと整合させる

-- action → action_type にリネーム
alter table public.inquiry_logs rename column action to action_type;

-- content カラム追加（対応内容のテキスト）
alter table public.inquiry_logs add column content text;

-- created_at カラム追加（logged_at と同じデフォルト値）
alter table public.inquiry_logs add column created_at timestamptz not null default now();

-- 既存データがあれば logged_at の値を created_at にコピー
update public.inquiry_logs set created_at = logged_at where created_at = now();
