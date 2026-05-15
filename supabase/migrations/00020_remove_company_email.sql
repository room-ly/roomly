-- メールアドレスはユーザーに紐づくため、会社テーブルからは削除
alter table public.companies drop column if exists email;
