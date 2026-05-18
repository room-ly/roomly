-- 会社の振込元口座（全銀CSV出力用、複数登録可）
create table public.company_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  label text not null,                  -- 表示名（例: メインバンク）
  bank_name text not null,              -- 銀行名
  bank_code text not null,              -- 銀行コード（4桁）
  branch_name text not null,            -- 支店名
  branch_code text not null,            -- 支店コード（3桁）
  account_type text not null default '1', -- 1=普通, 2=当座
  account_number text not null,         -- 口座番号（7桁）
  account_holder text not null,         -- 口座名義（カナ）
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_company_bank_accounts_company on public.company_bank_accounts(company_id);
alter table public.company_bank_accounts enable row level security;

-- RLSポリシー
create policy "company_bank_accounts_select" on public.company_bank_accounts
  for select using (company_id = public.company_id());
create policy "company_bank_accounts_insert" on public.company_bank_accounts
  for insert with check (company_id = public.company_id());
create policy "company_bank_accounts_update" on public.company_bank_accounts
  for update using (company_id = public.company_id());
create policy "company_bank_accounts_delete" on public.company_bank_accounts
  for delete using (company_id = public.company_id());

-- updated_at自動更新関数（存在しない場合のみ作成）
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- updated_atトリガー
create trigger set_updated_at_company_bank_accounts
  before update on public.company_bank_accounts
  for each row execute function update_updated_at();
