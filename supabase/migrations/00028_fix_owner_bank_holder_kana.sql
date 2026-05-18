-- bank_account_holderを全角カタカナに修正（全銀フォーマットは半角カナ必須、変換はアプリ側で行う）
-- シード名と一致しなかったオーナー分も含め全件更新

update public.owners set
  bank_name = 'みずほ銀行',
  bank_code = '0001',
  bank_branch = '丸の内支店',
  bank_branch_code = '004',
  bank_account_type = 'ordinary',
  bank_account_number = '1234567',
  bank_account_holder = 'サトウ ハナコ'
where name like '%佐藤%花子%' or name like '%サトウ%ハナコ%';

update public.owners set
  bank_name = '三菱UFJ銀行',
  bank_code = '0005',
  bank_branch = '新宿支店',
  bank_branch_code = '341',
  bank_account_type = 'ordinary',
  bank_account_number = '2345678',
  bank_account_holder = 'ヤマダ タロウ'
where name like '%山田%太郎%' or name like '%ヤマダ%タロウ%';

update public.owners set
  bank_name = '三井住友銀行',
  bank_code = '0009',
  bank_branch = '渋谷支店',
  bank_branch_code = '259',
  bank_account_type = 'ordinary',
  bank_account_number = '3456789',
  bank_account_holder = 'スズキ イチロウ'
where name like '%鈴木%一郎%' or name like '%スズキ%イチロウ%';

-- 残りのオーナー（bank_account_holderが漢字のまま or 未設定のもの）
update public.owners set
  bank_name = 'ゆうちょ銀行',
  bank_code = '9900',
  bank_branch = '〇一八',
  bank_branch_code = '018',
  bank_account_type = 'ordinary',
  bank_account_number = '7654321',
  bank_account_holder = 'オーナー'
where bank_account_holder is null
   or bank_account_holder !~ '^[ァ-ヶー　 A-ZＡ-Ｚ0-9０-９a-zａ-ｚ()（）./\-]+$';
