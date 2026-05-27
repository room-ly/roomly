-- 物件の管理手数料を「率（%）」と「固定額（円）」のどちらでも扱えるようにする。
-- 業界実態として戸建てや小規模物件では固定額方式が用いられるため、率一本では表現できない。
-- 既存データは全て「rate」（従来通り%方式）として後方互換を担保する。

alter table properties
  add column if not exists management_fee_type text not null default 'rate'
    check (management_fee_type in ('rate', 'fixed')),
  add column if not exists management_fee_amount numeric(10, 0) not null default 0;

comment on column properties.management_fee_type is
  '管理手数料の方式: rate=家賃の%（management_fee_rate参照）, fixed=固定額（management_fee_amount参照）';
comment on column properties.management_fee_amount is
  '管理手数料の固定額（円）。management_fee_type=fixedの場合に使用';
