-- ============================================================
-- 入居者アプリ用スキーマ
-- tenant_auth_users, move_out_requests, JWTフック拡張, RLS
-- ============================================================

-- 1. 入居者認証マッピングテーブル
create table public.tenant_auth_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  invited_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index idx_tenant_auth_users_tenant on public.tenant_auth_users(tenant_id);
create index idx_tenant_auth_users_company on public.tenant_auth_users(company_id);

alter table public.tenant_auth_users enable row level security;

-- 管理画面ユーザーは自社の入居者マッピングを全て操作可能
create policy tenant_auth_users_staff_policy on public.tenant_auth_users
  for all using (company_id = public.company_id());

-- 2. 退去申請テーブル
create table public.move_out_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  desired_move_out_date date not null,
  reason text,
  forwarding_postal_code text,
  forwarding_address text,
  forwarding_phone text,
  bank_name text,
  bank_branch text,
  bank_account_type text default '普通',
  bank_account_number text,
  bank_account_holder text,
  status text not null default 'pending',  -- pending / approved / rejected / completed
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_move_out_requests_contract on public.move_out_requests(contract_id);
create index idx_move_out_requests_tenant on public.move_out_requests(tenant_id);
create index idx_move_out_requests_company on public.move_out_requests(company_id);
create index idx_move_out_requests_status on public.move_out_requests(status);

alter table public.move_out_requests enable row level security;

-- 管理画面ユーザーは自社の退去申請を全て操作可能
create policy move_out_requests_staff_policy on public.move_out_requests
  for all using (company_id = public.company_id());

-- 3. maintenance_requestsにsourceカラム追加
alter table public.maintenance_requests
  add column if not exists source text not null default 'admin';

-- 4. JWTヘルパー関数
create or replace function public.tenant_id()
returns uuid as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid,
    null
  );
$$ language sql stable;

create or replace function public.user_type()
returns text as $$
  select coalesce(
    current_setting('request.jwt.claims', true)::json->>'user_type',
    'staff'
  );
$$ language sql stable;

-- 5. custom_access_token_hook 拡張（入居者対応）
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb as $$
declare
  claims jsonb;
  v_company_id uuid;
  v_role text;
  v_tenant_id uuid;
begin
  claims := event->'claims';

  -- まず管理画面ユーザーとして検索
  select company_id, role into v_company_id, v_role
  from public.users
  where id = (event->>'user_id')::uuid;

  if v_company_id is not null then
    claims := jsonb_set(claims, '{company_id}', to_jsonb(v_company_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{user_type}', '"staff"');
  else
    -- 入居者として検索
    select tenant_id, company_id into v_tenant_id, v_company_id
    from public.tenant_auth_users
    where auth_user_id = (event->>'user_id')::uuid;

    if v_tenant_id is not null then
      claims := jsonb_set(claims, '{company_id}', to_jsonb(v_company_id::text));
      claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_tenant_id::text));
      claims := jsonb_set(claims, '{user_type}', '"tenant"');
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$ language plpgsql security definer;

-- 6. 入居者向けRLSポリシー
-- 入居者は自分の退去申請のみ閲覧・作成可能
create policy move_out_requests_tenant_select on public.move_out_requests
  for select using (
    public.user_type() = 'tenant'
    and tenant_id = public.tenant_id()
  );

create policy move_out_requests_tenant_insert on public.move_out_requests
  for insert with check (
    public.user_type() = 'tenant'
    and tenant_id = public.tenant_id()
    and company_id = public.company_id()
  );

-- 入居者は自分の契約のみ参照可能
create policy contracts_tenant_user_select on public.contracts
  for select using (
    public.user_type() = 'tenant'
    and tenant_id = public.tenant_id()
  );

-- 入居者は自分の入居者情報のみ参照可能
create policy tenants_tenant_user_select on public.tenants
  for select using (
    public.user_type() = 'tenant'
    and id = public.tenant_id()
  );

-- 入居者は自分の契約の部屋情報を参照可能
create policy units_tenant_user_select on public.units
  for select using (
    public.user_type() = 'tenant'
    and id in (
      select unit_id from public.contracts
      where tenant_id = public.tenant_id() and status = 'active'
    )
  );

-- 入居者は自分の契約の物件情報を参照可能
create policy properties_tenant_user_select on public.properties
  for select using (
    public.user_type() = 'tenant'
    and id in (
      select property_id from public.units
      where id in (
        select unit_id from public.contracts
        where tenant_id = public.tenant_id() and status = 'active'
      )
    )
  );

-- 入居者は自分の修繕依頼を閲覧・作成可能
create policy maintenance_tenant_select on public.maintenance_requests
  for select using (
    public.user_type() = 'tenant'
    and tenant_id = public.tenant_id()
  );

create policy maintenance_tenant_insert on public.maintenance_requests
  for insert with check (
    public.user_type() = 'tenant'
    and tenant_id = public.tenant_id()
    and company_id = public.company_id()
  );

-- 入居者は自社の会社名を参照可能（表示用）
create policy companies_tenant_user_select on public.companies
  for select using (
    public.user_type() = 'tenant'
    and id = public.company_id()
  );
