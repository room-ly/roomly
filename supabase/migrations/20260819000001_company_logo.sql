-- 管理会社ロゴ・押印欄設定
-- 送金明細PDF等の帳票にロゴと押印欄を差し込むための設定を companies に追加する

alter table public.companies
  add column if not exists logo_path text,
  add column if not exists seal_column_enabled boolean not null default false;

comment on column public.companies.logo_path is 'company-logos バケット内のロゴ画像パス（{company_id}/{uuid}.{ext}）';
comment on column public.companies.seal_column_enabled is '帳票に押印欄を表示するか';

-- ロゴ用 Storage バケット
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

-- アップロード: 自社フォルダのみ
create policy "company_logos_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 更新: 自社フォルダのみ（同名パスへの上書き用）
create policy "company_logos_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 閲覧: 自社フォルダのみ
create policy "company_logos_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 削除: 自社フォルダのみ
create policy "company_logos_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 公開読み取り（public bucket。帳票PDFの印刷時に画像を解決するため）
create policy "company_logos_public_read"
on storage.objects for select
to anon
using (bucket_id = 'company-logos');
