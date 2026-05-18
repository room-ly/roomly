-- ポータルサイト（入居者向け物件検索）用の公開読み取りポリシー
-- anon ロールで vacancies（active のみ）・units（vacant のみ）・properties を閲覧可能にする

-- vacancies: active な募集のみ公開
create policy "portal_read_vacancies"
  on public.vacancies for select
  to anon
  using (listing_status = 'active');

-- units: vacant（空室）ステータスのみ公開
create policy "portal_read_units"
  on public.units for select
  to anon
  using (status = 'vacant');

-- properties: 空室がある物件のみ公開
create policy "portal_read_properties"
  on public.properties for select
  to anon
  using (
    exists (
      select 1 from public.units u
      where u.property_id = properties.id
        and u.status = 'vacant'
    )
  );
