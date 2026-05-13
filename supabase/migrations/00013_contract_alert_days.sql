-- 契約満了アラートの日数設定（会社ごと）
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contract_alert_days int NOT NULL DEFAULT 90;
