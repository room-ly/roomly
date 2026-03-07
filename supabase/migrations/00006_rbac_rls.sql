-- RBAC用ヘルパー関数: JWTからロールを取得
create or replace function public.user_role()
returns text as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::json->>'user_role'),
    'viewer'
  );
$$ language sql stable;

-- 削除ポリシー: adminのみ削除可能
-- 既存の全許可ポリシーに加えて、DELETE制約を追加

-- 注: 既存のpolicyは "for all" で定義されているため、
-- 削除操作はadminロールのみに制限する追加ポリシーが必要
-- ただし既存ポリシーが "for all" の場合、個別のDELETEポリシーは
-- 既存ポリシーと OR 条件になるため、既存ポリシーを更新する形が正しい

-- ここでは、APIルート側でロールチェックを行う方針とする
-- （RLSはテナント分離、アプリケーション層でRBAC）
-- 理由: 既存RLSポリシーの破壊的変更を避けるため
