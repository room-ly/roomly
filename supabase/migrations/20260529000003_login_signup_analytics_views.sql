-- 計測ビュー: SQLエディタで一発確認＋kanri側のダッシュボードから参照する
-- いずれもservice_roleのみ参照する想定（生データテーブルがservice_role限定のため）

-- ========== 1. 日別ログイン集計 ==========
create or replace view public.v_login_daily as
select
  date_trunc('day', attempted_at) as day,
  count(*)                                 as total_attempts,
  count(*) filter (where success)          as success_count,
  count(*) filter (where not success)      as failure_count,
  count(distinct email) filter (where success) as unique_success_emails,
  count(distinct ip_address) filter (where success) as unique_success_ips
from public.login_attempts
group by 1
order by 1 desc;

-- ========== 2. 国/地域別ログイン成功 ==========
create or replace view public.v_login_by_geo as
select
  coalesce(country, '(unknown)') as country,
  coalesce(region, '(unknown)')  as region,
  coalesce(city, '(unknown)')    as city,
  count(*) filter (where success)       as success_count,
  count(*) filter (where not success)   as failure_count,
  count(distinct email)                 as unique_emails,
  count(distinct ip_address)            as unique_ips,
  max(attempted_at)                     as last_seen_at
from public.login_attempts
group by 1, 2, 3
order by success_count desc;

-- ========== 3. 流入元別ログイン ==========
create or replace view public.v_login_by_source as
select
  coalesce(utm_source, '(direct)') as utm_source,
  coalesce(utm_medium, '')         as utm_medium,
  coalesce(utm_campaign, '')       as utm_campaign,
  count(*) filter (where success)     as success_count,
  count(distinct email) filter (where success) as unique_success_emails,
  max(attempted_at)                   as last_seen_at
from public.login_attempts
group by 1, 2, 3
order by success_count desc;

-- ========== 4. サインアップファネル ==========
-- 試行 → 失敗内訳 → 成功 を日別に並べる
create or replace view public.v_signup_funnel as
select
  date_trunc('day', attempted_at) as day,
  count(*)                                                        as total_attempts,
  count(*) filter (where success)                                 as success_count,
  count(*) filter (where not success and error_code = 'validation')      as validation_failures,
  count(*) filter (where not success and error_code = 'duplicate_email') as duplicate_email_failures,
  count(*) filter (where not success and error_code = 'auth_error')      as auth_failures,
  count(*) filter (where not success and error_code = 'profile_error')   as profile_failures,
  count(*) filter (where not success and error_code = 'company_insert_error') as company_insert_failures,
  count(*) filter (where not success and error_code not in (
    'validation','duplicate_email','auth_error','profile_error','company_insert_error'
  ))                                                                 as other_failures,
  case when count(*) > 0
       then round(100.0 * count(*) filter (where success) / count(*), 2)
       else null end                                                as success_rate_percent
from public.signup_attempts
group by 1
order by 1 desc;

-- ========== 5. 流入元別サインアップ（広告効果計測のメイン）==========
create or replace view public.v_signup_attribution as
select
  coalesce(utm_source, '(direct)') as utm_source,
  coalesce(utm_medium, '')         as utm_medium,
  coalesce(utm_campaign, '')       as utm_campaign,
  count(*)                            as attempts,
  count(*) filter (where success)     as conversions,
  case when count(*) > 0
       then round(100.0 * count(*) filter (where success) / count(*), 2)
       else null end                  as cv_rate_percent,
  count(distinct country) filter (where success) as unique_countries,
  count(distinct ip_address)          as unique_ips,
  max(attempted_at)                   as last_seen_at
from public.signup_attempts
group by 1, 2, 3
order by attempts desc;

-- ========== 6. 国/地域別サインアップ ==========
create or replace view public.v_signup_by_geo as
select
  coalesce(country, '(unknown)') as country,
  coalesce(region, '(unknown)')  as region,
  coalesce(city, '(unknown)')    as city,
  count(*)                            as attempts,
  count(*) filter (where success)     as conversions,
  count(distinct ip_address)          as unique_ips,
  max(attempted_at)                   as last_seen_at
from public.signup_attempts
group by 1, 2, 3
order by attempts desc;
