-- 同一部屋にactiveな契約が複数存在することを防ぐ
CREATE UNIQUE INDEX idx_contracts_one_active_per_unit
  ON contracts (unit_id)
  WHERE status = 'active';

-- 契約の終了日は開始日以降でなければならない
ALTER TABLE contracts
  ADD CONSTRAINT chk_contracts_dates
  CHECK (end_date IS NULL OR end_date >= start_date);

-- 家賃請求額は0以上
ALTER TABLE rent_billings
  ADD CONSTRAINT chk_rent_billings_amount
  CHECK (total_amount >= 0);

-- 部屋面積は正の値
ALTER TABLE units
  ADD CONSTRAINT chk_units_area
  CHECK (area_sqm IS NULL OR area_sqm > 0);

-- 複合インデックス: 家賃請求（契約+ステータス）
CREATE INDEX idx_rent_billings_contract_status
  ON rent_billings (contract_id, status);

-- 複合インデックス: 家賃請求（対象月+ステータス）
CREATE INDEX idx_rent_billings_month_status
  ON rent_billings (billing_month, status);

-- 複合インデックス: 契約（開始日降順）
CREATE INDEX idx_contracts_start_date_desc
  ON contracts (start_date DESC);

-- 複合インデックス: 問い合わせ（作成日降順）
CREATE INDEX idx_inquiries_created_at_desc
  ON inquiries (created_at DESC);

-- 複合インデックス: 修繕（物件+ステータス）
CREATE INDEX idx_maintenance_property_status
  ON maintenance_requests (property_id, status);

-- 複合インデックス: 修繕（報告日降順）
CREATE INDEX idx_maintenance_reported_date_desc
  ON maintenance_requests (reported_date DESC);

-- 複合インデックス: 送金（ステータス）
CREATE INDEX idx_owner_remittances_status
  ON owner_remittances (status);

-- 複合インデックス: 問い合わせログ（問い合わせ+作成日）
CREATE INDEX idx_inquiry_logs_inquiry_created
  ON inquiry_logs (inquiry_id, created_at DESC);

-- 複合インデックス: 契約（入居者+ステータス）
CREATE INDEX idx_contracts_tenant_status
  ON contracts (tenant_id, status);
