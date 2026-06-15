-- 運営admin向け: 会社ごとの稼働状況ビュー
-- 無料登録ユーザーが実際に使っているか（操作数・最終操作日・ログイン状況）を一覧で確認する。
-- audit_logs（実際のDB書き込み）を主指標とし、companies / login_attempts と結合する。

create or replace view public.v_company_activity as
with ops as (
  select
    company_id,
    count(*) filter (where created_at > now() - interval '7 days')  as ops_7d,
    count(*) filter (where created_at > now() - interval '30 days') as ops_30d,
    count(*)                                                        as ops_total,
    max(created_at)                                                 as last_op_at
  from public.audit_logs
  group by company_id
),
logins as (
  select
    company_id,
    count(*) filter (where success) as logins_ok,
    max(attempted_at) filter (where success) as last_login_at
  from public.login_attempts
  where company_id is not null
  group by company_id
),
member_counts as (
  select company_id, count(*) as user_count
  from public.users
  group by company_id
)
select
  c.id                                  as company_id,
  c.name,
  c.plan,
  c.max_units,
  c.is_demo,
  c.created_at                          as signed_up_at,
  coalesce(mc.user_count, 0)            as user_count,
  coalesce(o.ops_7d, 0)                 as ops_7d,
  coalesce(o.ops_30d, 0)                as ops_30d,
  coalesce(o.ops_total, 0)              as ops_total,
  o.last_op_at,
  coalesce(l.logins_ok, 0)             as logins_ok,
  l.last_login_at,
  -- 稼働区分: 直近7日に操作あり=active / 30日内=slowing / 操作ゼロ=dormant / 一度も操作なし=never
  case
    when coalesce(o.ops_total, 0) = 0                 then 'never'
    when coalesce(o.ops_7d, 0)    > 0                 then 'active'
    when coalesce(o.ops_30d, 0)   > 0                 then 'slowing'
    else                                                   'dormant'
  end                                   as activity_status,
  -- 最終操作からの経過日数
  case when o.last_op_at is not null
       then floor(extract(epoch from (now() - o.last_op_at)) / 86400)::int
  end                                   as days_since_last_op
from public.companies c
left join ops          o  on o.company_id  = c.id
left join logins       l  on l.company_id  = c.id
left join member_counts mc on mc.company_id = c.id;

comment on view public.v_company_activity is
  '運営admin向け。会社ごとの稼働状況（操作数・最終操作日・ログイン・稼働区分）。service_roleで読む。';
