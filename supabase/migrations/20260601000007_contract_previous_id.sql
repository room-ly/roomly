-- 契約更新（再契約）の履歴を追跡するため、前契約への自己参照を追加する。
--
-- 背景:
--   契約更新で家賃改定など条件が変わる場合、既存契約を上書きすると過去条件の履歴が失われ、
--   過去の家賃請求（旧家賃で発行済み）との整合も追えなくなる。
--   そこで「更新＝旧契約を expired にして、新条件で新契約レコードを作成」という運用にする。
--   previous_contract_id で更新元をたどれるようにし、契約の世代をチェーンで表現する。

alter table public.contracts
  add column if not exists previous_contract_id uuid
    references public.contracts(id) on delete set null;

comment on column public.contracts.previous_contract_id is
'契約更新（再契約）の更新元契約ID。この契約が前契約の更新版である場合に設定される。';

create index if not exists idx_contracts_previous_contract_id
  on public.contracts(previous_contract_id);
