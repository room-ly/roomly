-- HP側(anonキー)から実行できる操作のRLSポリシー
--
-- HPはservice_roleキーを持たないため、以下を anon でも実行できるようにする:
--   - affiliate_clicks のinsert（クリック計測）
--   - affiliates のinsert（アフィリエイト申込）
--   - affiliates のselect は許可しない（コードから本人情報を引けないようにするため）

-- 1. affiliate_clicks: anonでinsert許可（クリック計測）
drop policy if exists "affiliate_clicks_insert_anon" on public.affiliate_clicks;
create policy "affiliate_clicks_insert_anon"
  on public.affiliate_clicks
  for insert
  to anon
  with check (true);

-- selectは禁止（クリック履歴は本人ダッシュボード経由でservice_roleが取得）
drop policy if exists "affiliate_clicks_no_select_anon" on public.affiliate_clicks;
create policy "affiliate_clicks_no_select_anon"
  on public.affiliate_clicks
  for select
  to anon
  using (false);

-- 2. affiliates: anonで申込insert許可
-- 申込時はstatus=pending固定。コード生成はDBデフォルトorAPIで明示
drop policy if exists "affiliates_insert_anon" on public.affiliates;
create policy "affiliates_insert_anon"
  on public.affiliates
  for insert
  to anon
  with check (status = 'pending' and source = 'self_signup');

-- selectは禁止
drop policy if exists "affiliates_no_select_anon" on public.affiliates;
create policy "affiliates_no_select_anon"
  on public.affiliates
  for select
  to anon
  using (false);

-- 3. affiliate_conversions / affiliate_payouts: anonからは一切アクセス禁止
drop policy if exists "affiliate_conversions_no_anon" on public.affiliate_conversions;
create policy "affiliate_conversions_no_anon"
  on public.affiliate_conversions
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists "affiliate_payouts_no_anon" on public.affiliate_payouts;
create policy "affiliate_payouts_no_anon"
  on public.affiliate_payouts
  for all
  to anon
  using (false)
  with check (false);

-- 4. affiliate_prospects: anonからは禁止（運営のみ）
drop policy if exists "affiliate_prospects_no_anon" on public.affiliate_prospects;
create policy "affiliate_prospects_no_anon"
  on public.affiliate_prospects
  for all
  to anon
  using (false)
  with check (false);

-- 5. authenticated(kanriユーザ)向け: 全アフィリエイト関連テーブルは
-- admin判定の専用ロジックで制御するため、authenticatedからの直接アクセスも禁止。
-- 運営UIは service_role 経由でデータ取得する。
drop policy if exists "affiliates_no_auth" on public.affiliates;
create policy "affiliates_no_auth"
  on public.affiliates
  for all
  to authenticated
  using (false)
  with check (false);

drop policy if exists "affiliate_clicks_no_auth" on public.affiliate_clicks;
create policy "affiliate_clicks_no_auth"
  on public.affiliate_clicks
  for all
  to authenticated
  using (false)
  with check (false);

drop policy if exists "affiliate_conversions_no_auth" on public.affiliate_conversions;
create policy "affiliate_conversions_no_auth"
  on public.affiliate_conversions
  for all
  to authenticated
  using (false)
  with check (false);

drop policy if exists "affiliate_payouts_no_auth" on public.affiliate_payouts;
create policy "affiliate_payouts_no_auth"
  on public.affiliate_payouts
  for all
  to authenticated
  using (false)
  with check (false);

drop policy if exists "affiliate_prospects_no_auth" on public.affiliate_prospects;
create policy "affiliate_prospects_no_auth"
  on public.affiliate_prospects
  for all
  to authenticated
  using (false)
  with check (false);
