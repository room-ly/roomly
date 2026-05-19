-- 契約書・重要事項説明書の生成に必要なカラム追加

-- ============================================================
-- contracts テーブル拡張
-- ============================================================
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_date date;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS important_explanation_date date;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_due_day int;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS guarantor_name text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS guarantor_phone text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS insurance_company text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS brokerage_fee numeric(10,0);

-- ============================================================
-- properties テーブル拡張（登記・インフラ・リスク情報）
-- ============================================================

-- 登記情報
ALTER TABLE properties ADD COLUMN IF NOT EXISTS registered_owner_name text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_exists boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgagee text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_amount numeric(15,0);

-- インフラ
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_supply text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS gas_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sewage text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS septic_tank boolean DEFAULT false;

-- リスク調査
ALTER TABLE properties ADD COLUMN IF NOT EXISTS asbestos_survey text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS earthquake_resistance text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS flood_hazard_zone boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landslide_hazard_zone boolean DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tsunami_hazard_zone boolean DEFAULT false;
