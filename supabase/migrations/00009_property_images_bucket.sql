-- 物件画像用 Storage バケット
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- アップロードポリシー: 自社の物件画像のみアップロード可
create policy "property_images_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 閲覧ポリシー: 自社の画像のみ閲覧可
create policy "property_images_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 削除ポリシー: 自社の画像のみ削除可
create policy "property_images_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-images'
  and (storage.foldername(name))[1] = public.company_id()::text
);

-- 公開読み取り（public bucket なので匿名アクセス可）
create policy "property_images_public_read"
on storage.objects for select
to anon
using (bucket_id = 'property-images');
