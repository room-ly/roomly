-- アプリ内通知テーブル
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,  -- NULLなら全ユーザー向け
  title text not null,
  body text,
  type text not null default 'info',  -- info / warning / danger
  link text,  -- クリック時の遷移先
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_company on public.notifications(company_id);
create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read on public.notifications(is_read);

alter table public.notifications enable row level security;

create policy notifications_tenant_policy on public.notifications
  for all using (company_id = public.company_id());
