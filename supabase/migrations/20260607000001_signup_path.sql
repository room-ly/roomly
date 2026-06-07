-- デモ→無料登録などの「登録に至った導線」を追跡するためのカラム。
-- utm_source/gclid（元の広告流入）は温存したまま、
-- 「デモを触ってから登録した」等のアプリ内導線を別軸で記録する。
-- 例: 'demo' = デモ画面のバナーから登録

alter table public.companies
  add column if not exists signup_path text;

alter table public.signup_attempts
  add column if not exists signup_path text;

comment on column public.companies.signup_path is
  'アプリ内の登録導線（例: demo=デモバナー経由）。広告流入のutm_source等とは別軸。';
comment on column public.signup_attempts.signup_path is
  'アプリ内の登録導線（例: demo=デモバナー経由）。広告流入のutm_source等とは別軸。';
