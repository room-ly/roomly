-- 広告流入・ログイン計測の拡張
-- 目的:
--  1) login_attempts に成功も記録し、地域・UA・流入元を可視化
--  2) signup_attempts でアカウント作成試行（成功/失敗）を計測
-- いずれもservice_role経由でのみ書き込む。RLSはservice_roleのみ許可。

-- ========== 1. login_attempts 拡張 ==========
-- 既存スキーマ: id / email / attempted_at / success / ip_address
-- 既存データを壊さないように全カラムNULL許容で追加する

alter table public.login_attempts
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists user_agent text,
  add column if not exists referrer text,
  add column if not exists landing_path text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text;

create index if not exists idx_login_attempts_success on public.login_attempts (success, attempted_at desc);
create index if not exists idx_login_attempts_country on public.login_attempts (country);
create index if not exists idx_login_attempts_utm_source on public.login_attempts (utm_source);

-- 古いレコード削除トリガが24時間で消してしまうと広告分析に使えないので、
-- 90日保持に変更（cleanup_old_login_attempts() を更新）
create or replace function public.cleanup_old_login_attempts() returns trigger
language plpgsql
as $$
begin
  delete from public.login_attempts where attempted_at < now() - interval '90 days';
  return null;
end;
$$;

-- ========== 2. signup_attempts 新規 ==========
-- 会社作成より前にinsertするので、companies/usersへのFKは持たない（独立テーブル）
-- 成功・失敗・重複メール等のエラーパターンを全て記録する
create table if not exists public.signup_attempts (
  id uuid primary key default gen_random_uuid(),
  attempted_at timestamp with time zone not null default now(),
  email text,
  company_name text,
  name text,
  success boolean not null default false,
  error_code text,                   -- 例: "duplicate_email" / "validation" / "auth_error" / "profile_error"
  error_message text,
  ip_address text,
  country text,
  region text,
  city text,
  user_agent text,
  referrer text,
  landing_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  -- 成功時のみ紐付ける（参考情報）
  created_company_id uuid
);

create index if not exists idx_signup_attempts_attempted_at on public.signup_attempts (attempted_at desc);
create index if not exists idx_signup_attempts_email on public.signup_attempts (email);
create index if not exists idx_signup_attempts_success on public.signup_attempts (success, attempted_at desc);
create index if not exists idx_signup_attempts_country on public.signup_attempts (country);
create index if not exists idx_signup_attempts_utm_source on public.signup_attempts (utm_source);

alter table public.signup_attempts enable row level security;

drop policy if exists "signup_attempts_service_role_only" on public.signup_attempts;
create policy "signup_attempts_service_role_only"
  on public.signup_attempts
  using (auth.role() = 'service_role');

grant all on table public.signup_attempts to anon;
grant all on table public.signup_attempts to authenticated;
grant all on table public.signup_attempts to service_role;

-- 古いsignup_attemptsを90日で削除
create or replace function public.cleanup_old_signup_attempts() returns trigger
language plpgsql
as $$
begin
  delete from public.signup_attempts where attempted_at < now() - interval '90 days';
  return null;
end;
$$;

drop trigger if exists trg_cleanup_signup_attempts on public.signup_attempts;
create trigger trg_cleanup_signup_attempts
after insert on public.signup_attempts
for each statement execute function public.cleanup_old_signup_attempts();
