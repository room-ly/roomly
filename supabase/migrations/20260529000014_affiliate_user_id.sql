-- アフィリエイトをSupabase Authユーザーに紐付ける。
-- hp.roomly.jp で affiliate が signup/login するための user_id カラムを追加。
-- 既存レコードは user_id NULL のまま運用継続（メールアドレスでマッチして後で埋める想定）。

alter table public.affiliates
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists affiliates_user_id_key
  on public.affiliates(user_id)
  where user_id is not null;

create index if not exists affiliates_email_idx
  on public.affiliates(email);

comment on column public.affiliates.user_id is
  'Supabase Auth ユーザーID。hpでsignupしたアフィリエイトはここに紐付く。';
