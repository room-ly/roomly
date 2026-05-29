-- アフィリエイトのsignup/login試行を計測するテーブル。
-- kanri側の login_attempts / signup_attempts と分離して管理する
-- (混在させると分析時のフィルタが煩雑になるため)。

create table if not exists public.affiliate_signup_attempts (
  id uuid primary key default gen_random_uuid(),
  attempted_at timestamptz not null default now(),
  email text,
  success boolean not null default false,
  error_code text,
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
  ga_client_id text,
  affiliate_code text
);

create index if not exists affiliate_signup_attempts_attempted_at_idx
  on public.affiliate_signup_attempts(attempted_at desc);
create index if not exists affiliate_signup_attempts_email_idx
  on public.affiliate_signup_attempts(email);

create table if not exists public.affiliate_login_attempts (
  id uuid primary key default gen_random_uuid(),
  attempted_at timestamptz not null default now(),
  email text,
  success boolean not null default false,
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
  ga_client_id text,
  affiliate_code text
);

create index if not exists affiliate_login_attempts_attempted_at_idx
  on public.affiliate_login_attempts(attempted_at desc);
create index if not exists affiliate_login_attempts_email_idx
  on public.affiliate_login_attempts(email);

alter table public.affiliate_signup_attempts enable row level security;
alter table public.affiliate_login_attempts enable row level security;

-- anonとauthenticatedからの直接アクセスは禁止(service_role経由のみ)
drop policy if exists "aff_signup_attempts_no_anon" on public.affiliate_signup_attempts;
create policy "aff_signup_attempts_no_anon"
  on public.affiliate_signup_attempts
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "aff_signup_attempts_no_auth" on public.affiliate_signup_attempts;
create policy "aff_signup_attempts_no_auth"
  on public.affiliate_signup_attempts
  for all
  to authenticated
  using (false)
  with check (false);

drop policy if exists "aff_login_attempts_no_anon" on public.affiliate_login_attempts;
create policy "aff_login_attempts_no_anon"
  on public.affiliate_login_attempts
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "aff_login_attempts_no_auth" on public.affiliate_login_attempts;
create policy "aff_login_attempts_no_auth"
  on public.affiliate_login_attempts
  for all
  to authenticated
  using (false)
  with check (false);
