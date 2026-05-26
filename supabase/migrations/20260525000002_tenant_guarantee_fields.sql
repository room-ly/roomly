-- 入居者の保証方式と保証会社情報
-- 旧 00046_tenant_guarantee_fields.sql は _archive に退避済みだが、
-- 本番DBには未適用かつ baseline にも欠落していたため、改めて適用する。
-- 賃貸保証は機関保証（保証会社）が主流のため、保証方式を選べるようにする。
--   company    : 保証会社（家賃債務保証会社）
--   individual : 個人連帯保証（従来の保証人）
--   none       : 保証なし
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS guarantee_type text
    CHECK (guarantee_type IN ('company', 'individual', 'none')),
  ADD COLUMN IF NOT EXISTS guarantee_company_name text,
  ADD COLUMN IF NOT EXISTS guarantee_contract_number text,
  ADD COLUMN IF NOT EXISTS guarantee_fee integer;

-- 既存データの移行: 個人保証人情報が入っている入居者は個人連帯保証とみなす
UPDATE public.tenants
SET guarantee_type = 'individual'
WHERE guarantee_type IS NULL
  AND (
    guarantor_name IS NOT NULL
    OR guarantor_phone IS NOT NULL
    OR guarantor_address IS NOT NULL
  );
