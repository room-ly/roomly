-- デモアカウント用の制限管理

-- companies に is_demo フラグ追加
alter table public.companies
  add column if not exists is_demo boolean not null default false;

-- デモ会社の書き込み回数を1日単位で追跡するテーブル
create table if not exists public.demo_write_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  action text not null, -- 'create' | 'update' | 'delete'
  table_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists demo_write_logs_company_date_idx
  on public.demo_write_logs (company_id, created_at);

-- RLS
alter table public.demo_write_logs enable row level security;

create policy demo_write_logs_tenant_policy on public.demo_write_logs
  for all using (company_id = public.company_id());

-- デモデータのリセット用: デモ会社の全業務データを削除する関数
-- Edge Function から service_role で呼び出す
create or replace function public.reset_demo_data(demo_company_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- 書き込みログをクリア
  delete from public.demo_write_logs where company_id = demo_company_id;
  -- 書類
  delete from public.documents where company_id = demo_company_id;
  -- 問い合わせ対応履歴
  delete from public.inquiry_logs where inquiry_id in (
    select id from public.inquiries where company_id = demo_company_id
  );
  delete from public.inquiries where company_id = demo_company_id;
  -- 修繕
  delete from public.maintenance_logs where request_id in (
    select id from public.maintenance_requests where company_id = demo_company_id
  );
  delete from public.maintenance_requests where company_id = demo_company_id;
  -- 送金
  delete from public.owner_remittance_items where remittance_id in (
    select id from public.owner_remittances where company_id = demo_company_id
  );
  delete from public.owner_remittances where company_id = demo_company_id;
  -- 家賃
  delete from public.rent_payments where company_id = demo_company_id;
  delete from public.rent_billings where company_id = demo_company_id;
  -- 経費
  delete from public.expenses where company_id = demo_company_id;
  -- 契約
  delete from public.contracts where company_id = demo_company_id;
  -- 入居者
  delete from public.tenants where company_id = demo_company_id;
  -- 空室情報
  delete from public.vacancies where company_id = demo_company_id;
  -- 区画
  delete from public.units where property_id in (
    select id from public.properties where company_id = demo_company_id
  );
  -- 物件
  delete from public.properties where company_id = demo_company_id;
  -- オーナー
  delete from public.owners where company_id = demo_company_id;
end;
$$;
