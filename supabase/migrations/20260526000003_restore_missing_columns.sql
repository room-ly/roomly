-- baseline 集約で取りこぼされた業務カラムの復活。
--
-- 経緯:
--   旧 _archive/00039_add_missing_columns.sql で追加していた以下のカラムが、
--   baseline (20260525000000_baseline.sql) への転記時に漏れていた。
--   コード側は引き続き参照しているため、Supabase CLI による型再生成で型エラーが顕在化した。
--   関連: [[project_baseline_missing_columns]]

-- expenses: 業者名・請求書番号
alter table public.expenses add column if not exists vendor_name text;
alter table public.expenses add column if not exists invoice_number text;

-- maintenance_requests: 業者連絡先・作業予定日
alter table public.maintenance_requests add column if not exists vendor_phone text;
alter table public.maintenance_requests add column if not exists scheduled_date date;

-- owner_remittances: 振込実行日（sent_dateとは別に明示的な振込日を保持）
alter table public.owner_remittances add column if not exists transfer_date date;
