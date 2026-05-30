-- 敷金・礼金に単位（円 / ヶ月）を持たせる
-- deposit_unit / key_money_unit: 'jpy' = 円（既存挙動）/ 'months' = ヶ月（賃料に乗じて円換算）
-- 値の型を numeric(10,2) に変更して 0.5ヶ月などの小数月数を扱えるようにする

-- units
alter table public.units
  alter column deposit type numeric(12,2),
  alter column key_money type numeric(12,2);

alter table public.units
  add column if not exists deposit_unit text not null default 'jpy',
  add column if not exists key_money_unit text not null default 'jpy';

alter table public.units
  drop constraint if exists units_deposit_unit_check;
alter table public.units
  add constraint units_deposit_unit_check check (deposit_unit in ('jpy','months'));

alter table public.units
  drop constraint if exists units_key_money_unit_check;
alter table public.units
  add constraint units_key_money_unit_check check (key_money_unit in ('jpy','months'));

-- contracts
alter table public.contracts
  alter column deposit type numeric(12,2),
  alter column key_money type numeric(12,2),
  alter column renewal_fee type numeric(12,2);

alter table public.contracts
  add column if not exists deposit_unit text not null default 'jpy',
  add column if not exists key_money_unit text not null default 'jpy',
  add column if not exists renewal_fee_unit text not null default 'jpy';

alter table public.contracts
  drop constraint if exists contracts_deposit_unit_check;
alter table public.contracts
  add constraint contracts_deposit_unit_check check (deposit_unit in ('jpy','months'));

alter table public.contracts
  drop constraint if exists contracts_key_money_unit_check;
alter table public.contracts
  add constraint contracts_key_money_unit_check check (key_money_unit in ('jpy','months'));

alter table public.contracts
  drop constraint if exists contracts_renewal_fee_unit_check;
alter table public.contracts
  add constraint contracts_renewal_fee_unit_check check (renewal_fee_unit in ('jpy','months'));

comment on column public.units.deposit_unit is '敷金の単位: jpy=円, months=ヶ月（賃料に乗じて算出）';
comment on column public.units.key_money_unit is '礼金の単位: jpy=円, months=ヶ月（賃料に乗じて算出）';
comment on column public.contracts.deposit_unit is '敷金の単位: jpy=円, months=ヶ月（賃料に乗じて算出）';
comment on column public.contracts.key_money_unit is '礼金の単位: jpy=円, months=ヶ月（賃料に乗じて算出）';
comment on column public.contracts.renewal_fee_unit is '更新料の単位: jpy=円, months=ヶ月（賃料に乗じて算出）';
