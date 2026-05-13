-- ============================================================
-- ユーザー論理削除対応
-- deleted_at カラム追加 + is_active=false のユーザーをログイン時に弾く
-- ============================================================

alter table public.users add column deleted_at timestamptz;

-- custom_access_token_hook を更新: is_active=false のユーザーはクレームを注入しない
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb as $$
declare
  claims jsonb;
  user_company_id uuid;
  user_role text;
  user_is_active boolean;
begin
  select company_id, role, is_active
  into user_company_id, user_role, user_is_active
  from public.users
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if user_is_active = false then
    -- 無効化されたユーザーにはクレームを注入しない
    -- フロントエンド側でcompany_id未取得→ログアウトされる
    return event;
  end if;

  if user_company_id is not null then
    claims := jsonb_set(claims, '{company_id}', to_jsonb(user_company_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$ language plpgsql security definer;
