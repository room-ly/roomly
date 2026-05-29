-- 広告計測・課金分析用カラム/テーブル追加
-- 既存companiesへの影響を避けるため、全カラムNULL許容・デフォルトなし

-- 1. companies に流入元・初回課金日を記録するカラムを追加
alter table public.companies
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists referrer text,
  add column if not exists landing_path text,
  add column if not exists signup_gclid text,
  add column if not exists subscription_started_at timestamp with time zone;

create index if not exists idx_companies_utm_source on public.companies (utm_source);
create index if not exists idx_companies_utm_campaign on public.companies (utm_campaign);
create index if not exists idx_companies_subscription_started_at on public.companies (subscription_started_at);

-- 2. subscription_events: ステータス遷移を時系列で保存（チャーン率・継続日数の計測用）
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  stripe_subscription_id text,
  stripe_event_id text,
  plan text,
  metadata jsonb,
  occurred_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_subscription_events_company on public.subscription_events (company_id);
create index if not exists idx_subscription_events_occurred_at on public.subscription_events (occurred_at);
create index if not exists idx_subscription_events_type on public.subscription_events (event_type);
create unique index if not exists uq_subscription_events_stripe_event
  on public.subscription_events (stripe_event_id)
  where stripe_event_id is not null;

alter table public.subscription_events enable row level security;

-- 自社のイベントのみ参照可能（admin/manager想定）
drop policy if exists "subscription_events_select_own_company" on public.subscription_events;
create policy "subscription_events_select_own_company"
  on public.subscription_events
  for select
  using (company_id = public.company_id());

-- 書き込みはservice_roleのみ（webhook経由）。anon/authenticatedからの書き込みは想定しない
