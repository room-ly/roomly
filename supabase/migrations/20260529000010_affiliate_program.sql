-- アフィリエイトプログラム
-- 個人大家系インフルエンサー・士業・大家コミュニティ等への自前アフィリエイト
-- 報酬体系デフォルト: 初回なし、月額MRRの20%を24ヶ月

-- ============================================================
-- 1. affiliates: アフィリエイター本体
-- ============================================================
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  -- アフィリエイトコード（紹介リンクの ?ref= に使う8文字）
  code text not null unique,
  -- 表示名・連絡先
  name text not null,
  email text not null,
  phone text,
  -- 種別（運営側分類）
  prospect_type text, -- blogger / influencer / community / professional / other
  website_url text,
  social_url text,
  -- ステータス
  status text not null default 'pending', -- pending / active / suspended / rejected
  -- 報酬設定（個別交渉対応のため affiliate ごとに上書き可能）
  commission_initial_jpy integer not null default 0,        -- 初回固定報酬（円）
  commission_recurring_rate numeric(5,2) not null default 20.00, -- 継続率（%）
  commission_recurring_months integer not null default 24,  -- 継続月数
  -- 支払い情報（個人事業主向け）
  payout_method text default 'bank_transfer',
  bank_name text,
  bank_branch text,
  bank_account_type text,
  bank_account_number text,
  bank_account_holder text,
  invoice_registration_number text, -- インボイス登録番号
  -- 運営メモ
  source text not null default 'self_signup', -- self_signup / manual / prospect_converted
  notes text,
  approved_at timestamp with time zone,
  approved_by uuid references auth.users(id),
  rejected_at timestamp with time zone,
  rejected_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_affiliates_code on public.affiliates (code);
create index if not exists idx_affiliates_status on public.affiliates (status);
create index if not exists idx_affiliates_email on public.affiliates (lower(email));

alter table public.affiliates enable row level security;

-- 自分のレコードのみ参照可能（HP側のダッシュボードはservice_role経由 or
-- 別途magic linkセッションでaffiliate_idクレームを発行する想定）
drop policy if exists "affiliates_no_select_anon" on public.affiliates;
create policy "affiliates_no_select_anon"
  on public.affiliates
  for select
  to anon
  using (false);

-- ============================================================
-- 2. affiliate_clicks: クリック計測
-- ============================================================
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid references public.affiliates(id) on delete set null,
  code text not null,            -- 不正コードでも記録（無効コードの検知用）
  visitor_id text not null,      -- HPで発番するcookie UUID
  landing_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_hash text,                  -- 生IPは保存しない（hash化）
  user_agent text,
  referrer text,
  clicked_at timestamp with time zone not null default now()
);

create index if not exists idx_affiliate_clicks_affiliate on public.affiliate_clicks (affiliate_id);
create index if not exists idx_affiliate_clicks_visitor on public.affiliate_clicks (visitor_id);
create index if not exists idx_affiliate_clicks_clicked_at on public.affiliate_clicks (clicked_at);

alter table public.affiliate_clicks enable row level security;
-- 書き込みはservice_roleのみ（HP APIから）

-- ============================================================
-- 3. companies に attribution_visitor_id, affiliate_id を追加
-- ============================================================
alter table public.companies
  add column if not exists attribution_visitor_id text,
  add column if not exists affiliate_id uuid references public.affiliates(id),
  add column if not exists affiliate_code text;

create index if not exists idx_companies_affiliate_id on public.companies (affiliate_id);
create index if not exists idx_companies_attribution_visitor_id on public.companies (attribution_visitor_id);

-- ============================================================
-- 4. affiliate_conversions: 成果発生
-- ============================================================
create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete cascade,
  conversion_type text not null, -- signup / first_payment / recurring_payment
  -- 報酬計算
  amount_jpy integer not null,
  mrr_at_conversion_jpy integer,        -- そのとき計算に使ったMRR（後で監査用）
  recurring_month_index integer,        -- 何ヶ月目の継続（1〜24）
  -- ステータス管理
  status text not null default 'pending', -- pending / approved / paid / rejected / clawback
  occurred_at timestamp with time zone not null default now(),
  approved_at timestamp with time zone,
  approved_by uuid references auth.users(id),
  paid_at timestamp with time zone,
  payout_id uuid,
  -- メタ
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_affiliate_conversions_affiliate on public.affiliate_conversions (affiliate_id);
create index if not exists idx_affiliate_conversions_company on public.affiliate_conversions (company_id);
create index if not exists idx_affiliate_conversions_status on public.affiliate_conversions (status);
create index if not exists idx_affiliate_conversions_occurred on public.affiliate_conversions (occurred_at);

-- 同一会社・同一月の継続報酬重複防止
create unique index if not exists uq_affiliate_conversions_recurring
  on public.affiliate_conversions (company_id, recurring_month_index)
  where conversion_type = 'recurring_payment';

alter table public.affiliate_conversions enable row level security;

-- ============================================================
-- 5. affiliate_payouts: 月次支払い
-- ============================================================
create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  total_amount_jpy integer not null,
  conversion_count integer not null,
  status text not null default 'scheduled', -- scheduled / paid / failed / canceled
  scheduled_at timestamp with time zone,
  paid_at timestamp with time zone,
  payout_reference text, -- 振込明細番号等
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_affiliate_payouts_affiliate on public.affiliate_payouts (affiliate_id);
create index if not exists idx_affiliate_payouts_status on public.affiliate_payouts (status);

alter table public.affiliate_payouts enable row level security;

-- ============================================================
-- 6. affiliate_prospects: 自社からアプローチするターゲット管理
-- CLAUDE.md記載のエゴサ引っかけターゲットリスト（楽待コラム執筆者、
-- 不動産税理士、大家コミュニティ等）をここで一元管理
-- ============================================================
create table if not exists public.affiliate_prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prospect_type text, -- blogger / influencer / community / professional / media
  organization text,
  website_url text,
  social_url text,
  contact_email text,
  contact_phone text,
  contact_form_url text,
  followers_count integer,
  category text, -- 例: 個人大家 / 税理士 / 司法書士 / 大家コミュニティ
  status text not null default 'not_contacted',
  -- not_contacted / contacted / negotiating / converted / declined / on_hold
  priority integer default 3, -- 1(最高) 〜 5(最低)
  last_contacted_at timestamp with time zone,
  next_action_at timestamp with time zone,
  next_action text,
  notes text,
  converted_affiliate_id uuid references public.affiliates(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_affiliate_prospects_status on public.affiliate_prospects (status);
create index if not exists idx_affiliate_prospects_priority on public.affiliate_prospects (priority);
create index if not exists idx_affiliate_prospects_next_action_at on public.affiliate_prospects (next_action_at);

alter table public.affiliate_prospects enable row level security;

-- ============================================================
-- 7. ヘルパー: 8文字英数字のアフィリエイトコード生成
-- ============================================================
create or replace function public.generate_affiliate_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 紛らわしい文字除外
  result text := '';
  i integer;
  ch text;
  collision_count integer := 0;
begin
  loop
    result := '';
    for i in 1..8 loop
      ch := substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
      result := result || ch;
    end loop;
    -- 重複チェック
    perform 1 from public.affiliates where code = result;
    if not found then
      return result;
    end if;
    collision_count := collision_count + 1;
    if collision_count > 10 then
      raise exception 'affiliate code generation failed';
    end if;
  end loop;
end;
$$;

-- ============================================================
-- 8. updated_at トリガ
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_affiliates_updated_at on public.affiliates;
create trigger trg_affiliates_updated_at
  before update on public.affiliates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_affiliate_prospects_updated_at on public.affiliate_prospects;
create trigger trg_affiliate_prospects_updated_at
  before update on public.affiliate_prospects
  for each row execute function public.set_updated_at();
