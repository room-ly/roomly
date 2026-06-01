-- 契約更新（更新後条件の予約）に対応する。
--
-- 設計:
--   契約更新で家賃などが変わる場合、別レコードを作らず「現行契約に更新後の条件を予約として持たせる」。
--   renewal_effective_date（更新後条件の発効日＝次期間の開始日）を境に、家賃請求生成などが
--   「その時点で有効な値」を動的に選ぶ。cron による一括書き換えは行わない（漏れ・障害が起きない）。
--   更新契約書には現行（before）と更新後（after）の両方を印字する。
--
--   発効日前: rent / management_fee / end_date など現行カラムを使う
--   発効日以降: renewal_* カラムがあればそちらを使う

-- 前段の試作（再契約=新レコード方式）で追加したカラムは方式変更により不要。存在すれば削除。
drop index if exists public.idx_contracts_previous_contract_id;
alter table public.contracts drop column if exists previous_contract_id;

alter table public.contracts
  add column if not exists renewal_effective_date date,
  add column if not exists renewal_rent numeric(10,0),
  add column if not exists renewal_management_fee numeric(10,0),
  add column if not exists renewal_end_date date,
  add column if not exists renewal_fee_next numeric(10,0),
  add column if not exists renewal_notes text;

comment on column public.contracts.renewal_effective_date is
'更新後条件の発効日（＝次の契約期間の開始日）。この日以降、renewal_* の値が有効になる。NULLなら更新予約なし。';
comment on column public.contracts.renewal_rent is '更新後の賃料。NULLなら現行 rent を継続。';
comment on column public.contracts.renewal_management_fee is '更新後の管理費。NULLなら現行 management_fee を継続。';
comment on column public.contracts.renewal_end_date is '更新後の契約終了日。';
comment on column public.contracts.renewal_fee_next is '次回更新時に発生する更新料。';
comment on column public.contracts.renewal_notes is '更新に関する備考。';
