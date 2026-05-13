-- ============================================================
-- Stripe サブスクリプション連携
-- companies テーブルに課金状態カラムを追加
-- ============================================================

alter table public.companies
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column subscription_status text not null default 'none',
  -- none: 未課金 / active: 課金中 / past_due: 支払い遅延 / canceled: 解約済み / unpaid: 未払い
  add column subscription_current_period_end timestamptz;

-- 課金状態を判定するヘルパー関数
-- active のみが「課金中」扱い。それ以外はフリープラン制限が適用される
create or replace function public.is_subscription_active(company_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.companies
    where id = company_id
      and subscription_status = 'active'
      and (subscription_current_period_end is null or subscription_current_period_end > now())
  );
$$ language sql stable security definer;
