-- baseline 集約で取りこぼされた残りのスキーマ復活。
--
-- 経緯:
--   旧 _archive/00038_move_out_checklist.sql と _archive/00044_email_notification_tracking.sql
--   が baseline (20260525000000_baseline.sql) への転記時に漏れていた。
--   コード側 (kanri/src/app/api/contracts/[id]/checklist/route.ts と
--   kanri/src/app/api/cron/notifications/route.ts) は引き続き参照しており、
--   型再生成で型エラーが顕在化した。
--   関連: [[project_baseline_missing_columns]]

-- ============================================================
-- 1. 退去チェックリスト (00038)
-- ============================================================

create table if not exists public.move_out_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  category text not null default 'general',
  item_name text not null,
  is_checked boolean not null default false,
  notes text,
  checked_at timestamptz,
  checked_by uuid references public.users(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.move_out_checklist_items enable row level security;

drop policy if exists move_out_checklist_tenant_policy on public.move_out_checklist_items;
create policy move_out_checklist_tenant_policy on public.move_out_checklist_items
  using (company_id = public.company_id())
  with check (company_id = public.company_id());

create index if not exists idx_checklist_company  on public.move_out_checklist_items (company_id);
create index if not exists idx_checklist_contract on public.move_out_checklist_items (contract_id);

-- ============================================================
-- 2. メール通知の重複送信防止カラム (00044)
-- ============================================================
-- Cron（日次）が同じ滞納・契約満了に毎日メールを送らないよう、最終送信日を記録する

alter table public.rent_billings add column if not exists overdue_notified_at date;
alter table public.contracts     add column if not exists expiry_notified_at date;
