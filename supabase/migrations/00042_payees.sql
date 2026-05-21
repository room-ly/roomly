-- ============================================================
-- 支払先マスタ（業者・保険会社・クリーニング業者等）
-- ============================================================

create table public.payees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  name_kana text,                          -- 全銀CSV用カナ（半角）
  category text not null default 'other',  -- repair / cleaning / insurance / other
  phone text,
  notes text,
  -- 振込先口座情報
  bank_code text,
  bank_name text,
  branch_code text,
  branch_name text,
  account_type text not null default 'ordinary', -- ordinary（普通）/ current（当座）
  account_number text,
  account_holder_kana text,               -- 口座名義カナ（全銀CSV用）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payees_company on public.payees(company_id);

alter table public.payees enable row level security;

create policy "payees: company members only" on public.payees
  using (company_id = public.company_id());

-- ============================================================
-- expenses と maintenance_requests に payee_id を追加
-- ============================================================

alter table public.expenses
  add column if not exists payee_id uuid references public.payees(id) on delete set null;

alter table public.maintenance_requests
  add column if not exists payee_id uuid references public.payees(id) on delete set null;

create index idx_expenses_payee on public.expenses(payee_id);
create index idx_maintenance_payee on public.maintenance_requests(payee_id);
