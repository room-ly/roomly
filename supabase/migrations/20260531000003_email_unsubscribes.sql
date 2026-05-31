-- フォローアップメール等の配信停止管理
-- 送信時にトークン付きで record を作成し、ユーザーがURL経由で unsubscribed_at をセットする
create table if not exists public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  category text not null default 'all', -- 'followup' or 'all'
  token text not null unique,
  unsubscribed_at timestamptz,
  resubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, category)
);

create index if not exists idx_email_unsubscribes_email on public.email_unsubscribes (email);
create index if not exists idx_email_unsubscribes_token on public.email_unsubscribes (token);

-- フォローアップメール送信履歴(重複送信防止 + 分析用)
create table if not exists public.email_followup_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  email text not null,
  template text not null, -- 'inactive_7d' 等
  sent_at timestamptz not null default now(),
  resend_id text,
  unique (user_id, template)
);

create index if not exists idx_email_followup_logs_email on public.email_followup_logs (email);
create index if not exists idx_email_followup_logs_sent_at on public.email_followup_logs (sent_at);

-- RLS: anon/authenticated からの直接アクセスは禁止(service_role経由のみ)
alter table public.email_unsubscribes enable row level security;
alter table public.email_followup_logs enable row level security;
