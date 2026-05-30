-- ロール体系を admin / staff / viewer の3つに統合する。
-- manager は staff に降格する（=削除以外のCRUD可、ユーザー管理不可）。

UPDATE public.users SET role = 'staff' WHERE role = 'manager';

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'staff', 'viewer'));
