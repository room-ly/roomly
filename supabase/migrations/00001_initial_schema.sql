-- Estate 初期スキーマ
-- 賃貸管理会社向けSaaS

-- ============================================================
-- ユーティリティ
-- ============================================================

create or replace function public.company_id()
returns uuid as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid,
    null
  );
$$ language sql stable;

-- ============================================================
-- 管理会社・ユーザー
-- ============================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  postal_code text,
  address text,
  phone text,
  email text,
  plan text not null default 'free', -- free / pro
  max_units int not null default 50,  -- フリーミアム上限
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'staff', -- admin / manager / staff / viewer
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- オーナー
-- ============================================================

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  postal_code text,
  address text,
  bank_name text,
  bank_branch text,
  bank_account_type text, -- 普通 / 当座
  bank_account_number text,
  bank_account_holder text,
  management_fee_rate numeric(5,2) not null default 5.00, -- 管理手数料率 %
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 物件・部屋
-- ============================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete restrict,
  name text not null,                    -- 建物名
  property_type text not null default 'apartment', -- apartment / house / commercial / parking
  postal_code text,
  address text not null,
  structure text,                        -- RC / SRC / 木造 etc
  floors int,
  built_year int,
  total_units int,
  nearest_station text,
  walk_minutes int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  unit_number text not null,              -- 部屋番号
  floor int,
  layout text,                            -- 1K / 2LDK etc
  area_sqm numeric(8,2),                  -- 専有面積 m²
  rent numeric(10,0) not null default 0,  -- 賃料
  management_fee numeric(10,0) not null default 0, -- 共益費・管理費
  deposit numeric(10,0) not null default 0,  -- 敷金
  key_money numeric(10,0) not null default 0, -- 礼金
  status text not null default 'vacant',  -- vacant / occupied / reserved / maintenance
  equipment text[],                       -- 設備リスト
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 入居者
-- ============================================================

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  name_kana text,
  phone text,
  email text,
  postal_code text,
  address text,                           -- 現住所（入居前）
  date_of_birth date,
  workplace text,
  workplace_phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  guarantor_name text,
  guarantor_phone text,
  guarantor_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 契約
-- ============================================================

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  contract_type text not null default 'fixed', -- fixed(定期) / ordinary(普通)
  start_date date not null,
  end_date date,
  rent numeric(10,0) not null,            -- 契約賃料
  management_fee numeric(10,0) not null default 0,
  deposit numeric(10,0) not null default 0,
  key_money numeric(10,0) not null default 0,
  renewal_fee numeric(10,0) not null default 0, -- 更新料
  status text not null default 'active',  -- active / expired / terminated / pending
  move_in_date date,
  move_out_date date,
  special_terms text,                     -- 特約事項
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 家賃請求・入金
-- ============================================================

create table public.rent_billings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  billing_month date not null,            -- 請求対象月 (YYYY-MM-01)
  rent numeric(10,0) not null,
  management_fee numeric(10,0) not null default 0,
  other_amount numeric(10,0) not null default 0,
  other_description text,
  total_amount numeric(10,0) not null,
  due_date date not null,
  status text not null default 'unpaid',  -- unpaid / partial / paid / overdue
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rent_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  billing_id uuid not null references public.rent_billings(id) on delete restrict,
  amount numeric(10,0) not null,
  payment_date date not null,
  payment_method text not null default 'transfer', -- transfer / card / cash / debit
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- オーナー送金
-- ============================================================

create table public.owner_remittances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete restrict,
  remittance_month date not null,         -- 送金対象月 (YYYY-MM-01)
  total_rent numeric(10,0) not null default 0,
  management_fee_deducted numeric(10,0) not null default 0,
  expense_deducted numeric(10,0) not null default 0,
  net_amount numeric(10,0) not null default 0,
  status text not null default 'draft',   -- draft / confirmed / sent
  sent_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_remittance_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  remittance_id uuid not null references public.owner_remittances(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  item_type text not null,                -- rent / expense / adjustment
  description text not null,
  amount numeric(10,0) not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 経費
-- ============================================================

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  owner_id uuid references public.owners(id) on delete set null,
  category text not null,                 -- repair / cleaning / insurance / tax / utility / other
  description text not null,
  amount numeric(10,0) not null,
  expense_date date not null,
  is_owner_charge boolean not null default false, -- オーナー負担
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 修繕・メンテナンス
-- ============================================================

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'other', -- plumbing / electrical / structural / equipment / other
  priority text not null default 'normal', -- low / normal / high / urgent
  status text not null default 'open',    -- open / in_progress / waiting_parts / completed / cancelled
  reported_date date not null default current_date,
  completed_date date,
  vendor_name text,                       -- 業者名
  estimated_cost numeric(10,0),
  actual_cost numeric(10,0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  request_id uuid not null references public.maintenance_requests(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,                   -- 対応内容
  logged_at timestamptz not null default now()
);

-- ============================================================
-- 問い合わせ・クレーム
-- ============================================================

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  inquiry_type text not null default 'general', -- general / complaint / noise / facility / move_out / other
  title text not null,
  description text,
  status text not null default 'open',    -- open / in_progress / resolved / closed
  priority text not null default 'normal', -- low / normal / high
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiry_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  logged_at timestamptz not null default now()
);

-- ============================================================
-- 書類管理
-- ============================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  document_type text not null,            -- contract / key_receipt / inspection / photo / other
  file_name text not null,
  file_path text not null,                -- Supabase Storage path
  file_size int,
  mime_type text,
  notes text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 空室募集
-- ============================================================

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  available_from date not null,
  listing_status text not null default 'active', -- active / paused / closed
  ad_comment text,                        -- 募集コメント
  viewing_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- インデックス
-- ============================================================

create index idx_users_company on public.users(company_id);
create index idx_owners_company on public.owners(company_id);
create index idx_properties_company on public.properties(company_id);
create index idx_properties_owner on public.properties(owner_id);
create index idx_units_company on public.units(company_id);
create index idx_units_property on public.units(property_id);
create index idx_units_status on public.units(status);
create index idx_tenants_company on public.tenants(company_id);
create index idx_contracts_company on public.contracts(company_id);
create index idx_contracts_unit on public.contracts(unit_id);
create index idx_contracts_tenant on public.contracts(tenant_id);
create index idx_contracts_status on public.contracts(status);
create index idx_rent_billings_company on public.rent_billings(company_id);
create index idx_rent_billings_contract on public.rent_billings(contract_id);
create index idx_rent_billings_status on public.rent_billings(status);
create index idx_rent_billings_month on public.rent_billings(billing_month);
create index idx_rent_payments_company on public.rent_payments(company_id);
create index idx_rent_payments_billing on public.rent_payments(billing_id);
create index idx_owner_remittances_company on public.owner_remittances(company_id);
create index idx_owner_remittances_owner on public.owner_remittances(owner_id);
create index idx_expenses_company on public.expenses(company_id);
create index idx_expenses_property on public.expenses(property_id);
create index idx_maintenance_company on public.maintenance_requests(company_id);
create index idx_maintenance_status on public.maintenance_requests(status);
create index idx_inquiries_company on public.inquiries(company_id);
create index idx_inquiries_status on public.inquiries(status);
create index idx_documents_company on public.documents(company_id);
create index idx_vacancies_company on public.vacancies(company_id);
create index idx_vacancies_unit on public.vacancies(unit_id);

-- ============================================================
-- RLS ポリシー
-- ============================================================

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.owners enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.contracts enable row level security;
alter table public.rent_billings enable row level security;
alter table public.rent_payments enable row level security;
alter table public.owner_remittances enable row level security;
alter table public.owner_remittance_items enable row level security;
alter table public.expenses enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_logs enable row level security;
alter table public.documents enable row level security;
alter table public.vacancies enable row level security;

-- 全テーブル共通: company_id でフィルタ
do $$
declare
  t text;
begin
  foreach t in array array[
    'owners','properties','units','tenants','contracts',
    'rent_billings','rent_payments','owner_remittances','owner_remittance_items',
    'expenses','maintenance_requests','maintenance_logs',
    'inquiries','inquiry_logs','documents','vacancies'
  ] loop
    execute format(
      'create policy %I on public.%I for all using (company_id = public.company_id())',
      t || '_tenant_policy', t
    );
  end loop;
end;
$$;

-- users テーブル
create policy users_tenant_policy on public.users
  for all using (company_id = public.company_id());

-- companies テーブル（自社のみ）
create policy companies_tenant_policy on public.companies
  for all using (id = public.company_id());

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies','users','owners','properties','units','tenants','contracts',
    'rent_billings','owner_remittances','expenses',
    'maintenance_requests','inquiries','vacancies'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;
