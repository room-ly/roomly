-- 入居者・保証人の詳細情報カラム追加

-- 入居者本人
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS annual_income integer;

-- 保証人
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_name_kana text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_date_of_birth date;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_workplace text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_workplace_phone text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_annual_income integer;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_relation text;
