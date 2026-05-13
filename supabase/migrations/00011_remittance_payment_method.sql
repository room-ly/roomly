-- 送金方法・手動金額上書き対応
alter table public.owner_remittances
  add column payment_method text not null default 'transfer',
  add column manual_override boolean not null default false,
  add column manual_net_amount numeric(10,0);

comment on column public.owner_remittances.payment_method is 'transfer=振込 / cash=現金';
comment on column public.owner_remittances.manual_override is '金額を手動上書きしたか';
comment on column public.owner_remittances.manual_net_amount is '手動上書き時の送金額（nullなら自動計算値を使用）';
