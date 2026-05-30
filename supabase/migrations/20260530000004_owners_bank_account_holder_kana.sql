-- オーナーの口座名義カナを追加（全銀振込はカナで処理されるため必須）
alter table public.owners
  add column if not exists bank_account_holder_kana text;
