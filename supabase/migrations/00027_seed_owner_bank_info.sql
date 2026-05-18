-- オーナーに銀行口座ダミーデータを設定（全銀CSV出力テスト用）
update public.owners set
  bank_name = 'みずほ銀行',
  bank_code = '0001',
  bank_branch = '東京営業部',
  bank_branch_code = '001',
  bank_account_type = 'ordinary',
  bank_account_number = '1234567',
  bank_account_holder = 'タナカ タロウ'
where name = '田中 太郎';

update public.owners set
  bank_name = '三菱UFJ銀行',
  bank_code = '0005',
  bank_branch = '新宿支店',
  bank_branch_code = '341',
  bank_account_type = 'ordinary',
  bank_account_number = '2345678',
  bank_account_holder = 'スズキ ハナコ'
where name = '鈴木 花子';

update public.owners set
  bank_name = '三井住友銀行',
  bank_code = '0009',
  bank_branch = '渋谷支店',
  bank_branch_code = '259',
  bank_account_type = 'ordinary',
  bank_account_number = '3456789',
  bank_account_holder = 'サトウ イチロウ'
where name = '佐藤 一郎';

-- name一致しないオーナー用（全件に銀行情報がない場合のフォールバック）
update public.owners set
  bank_name = 'ゆうちょ銀行',
  bank_code = '9900',
  bank_branch = '〇一八',
  bank_branch_code = '018',
  bank_account_type = 'ordinary',
  bank_account_number = '7654321',
  bank_account_holder = replace(replace(name, ' ', ''), '　', '')
where bank_code is null;
