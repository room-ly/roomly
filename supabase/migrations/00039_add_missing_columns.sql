-- expenses: 業者名・請求書番号を追加
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_name text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS invoice_number text;

-- maintenance_requests: 業者連絡先・作業予定日を追加
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS vendor_phone text;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS scheduled_date date;

-- owner_remittances: 振込日を追加（sent_dateとは別に明示的な振込実行日）
ALTER TABLE owner_remittances ADD COLUMN IF NOT EXISTS transfer_date date;
