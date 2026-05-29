-- ログイン計測の拡張・GA4名寄せ用カラム追加
-- 目的:
--  1) login_attempts に company_id / user_id を保存（どの会社・誰がログインしてるか可視化）
--  2) companies / signup_attempts / login_attempts に ga_client_id を保存（GA4 ⇄ DB名寄せ）

-- ========== 1. login_attempts: company/user 紐付け + GA4 client_id ==========
alter table public.login_attempts
  add column if not exists company_id uuid,
  add column if not exists user_id uuid,
  add column if not exists ga_client_id text;

create index if not exists idx_login_attempts_company on public.login_attempts (company_id, attempted_at desc);
create index if not exists idx_login_attempts_user on public.login_attempts (user_id, attempted_at desc);

-- ========== 2. companies: GA4 client_id ==========
alter table public.companies
  add column if not exists ga_client_id text;

create index if not exists idx_companies_ga_client_id on public.companies (ga_client_id);

-- ========== 3. signup_attempts: GA4 client_id ==========
alter table public.signup_attempts
  add column if not exists ga_client_id text;
