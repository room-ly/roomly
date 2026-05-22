-- 問い合わせテーブルに連携レコードへの参照カラムを追加
alter table public.inquiries
  add column if not exists linked_maintenance_id uuid references public.maintenance_requests(id) on delete set null,
  add column if not exists linked_move_out_request_id uuid references public.move_out_requests(id) on delete set null;
