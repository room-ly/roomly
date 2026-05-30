-- 稟議機能をオプトイン化する
-- companies.expense_approval_threshold が NULL のとき「稟議機能OFF」を意味する
-- 既存企業はまだ稟議を使っていないため、全社 NULL に戻してOFFスタートに揃える

ALTER TABLE public.companies
  ALTER COLUMN expense_approval_threshold DROP NOT NULL,
  ALTER COLUMN expense_approval_threshold DROP DEFAULT;

UPDATE public.companies
  SET expense_approval_threshold = NULL
  WHERE expense_approval_threshold IS NOT NULL;

COMMENT ON COLUMN public.companies.expense_approval_threshold IS
  '経費承認のしきい値（円）。NULL のとき稟議機能OFF（全経費が承認フローを経ずに登録される）。数値が入っている場合、その金額以上のオーナー負担経費が承認待ちになる';
