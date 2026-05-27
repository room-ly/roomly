-- 経費の承認者を「物件指名 → 会社デフォルト」で決定する仕組み。
-- 物件単位で承認者を指名でき、未指定なら会社デフォルトにフォールバック。
-- 候補は社内ユーザー（users）のみ。オーナー本人は対象外。

BEGIN;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS approver_user_id uuid
    REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS default_approver_user_id uuid
    REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.properties.approver_user_id IS
  'この物件の経費承認者（社内ユーザー）。未指定の場合は companies.default_approver_user_id を使用';
COMMENT ON COLUMN public.companies.default_approver_user_id IS
  '会社全体のデフォルト経費承認者。物件側で approver_user_id が未指定のときのフォールバック';

CREATE INDEX IF NOT EXISTS idx_properties_approver_user
  ON public.properties(approver_user_id);

COMMIT;
