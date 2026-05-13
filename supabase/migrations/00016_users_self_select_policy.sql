-- 自分自身のprofileは常にSELECT可能にする
-- company_idがJWTに入っていなくてもログインユーザーが自己情報を取得できる
create policy users_self_select on public.users
  for select using (id = auth.uid());
