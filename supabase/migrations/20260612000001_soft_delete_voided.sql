-- 論理削除（取り消し）のための voided_at / voided_by カラムを追加する。
--
-- 背景:
--   契約・請求・入金が FK の ON DELETE RESTRICT で繋がっており、入金履歴が1件でも
--   あると請求も契約も入居者も物理削除できないデッドロックが発生していた
--   （お客様報告: 入金→返金後に「削除に失敗しました」で全削除不可）。
--
-- 方針（Roomlyのドメインに最適な線引き）:
--   - まだ何にも使われていない「作りかけ」データ（入金履歴なし）→ 物理カスケード削除
--   - 一度でも入金/返金が記録された「使われた」データ → 論理削除（voided_at を立てる）
--     お金が動いた記録は会計・監査上、消した事実ごと残すべきなので物理削除しない。
--
-- voided_at IS NULL のものだけを通常画面に表示する。集計クエリ側も順次対応する。

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.rent_billings
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_by uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- 一覧表示で voided_at IS NULL を高速に絞るための部分インデックス
CREATE INDEX IF NOT EXISTS idx_contracts_not_voided
  ON public.contracts (company_id) WHERE voided_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rent_billings_not_voided
  ON public.rent_billings (company_id) WHERE voided_at IS NULL;

COMMENT ON COLUMN public.contracts.voided_at IS '論理削除（取り消し）日時。NULLでなければ画面に表示しない。';
COMMENT ON COLUMN public.rent_billings.voided_at IS '論理削除（取り消し）日時。NULLでなければ画面に表示しない。';
