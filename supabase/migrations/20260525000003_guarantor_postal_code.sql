-- 個人連帯保証人の郵便番号。
-- 入居者本人と同様に、郵便番号 → 住所の自動補完に使う。
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS guarantor_postal_code text;
