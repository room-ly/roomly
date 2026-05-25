-- 管理会社の宅建業者情報
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS estate_license text,         -- 宅地建物取引業者免許番号
  ADD COLUMN IF NOT EXISTS estate_agent_name text,      -- 専任宅地建物取引士氏名
  ADD COLUMN IF NOT EXISTS estate_agent_license text,   -- 取引士証登録番号
  ADD COLUMN IF NOT EXISTS postal_code text;            -- 郵便番号（未追加の場合のみ）
