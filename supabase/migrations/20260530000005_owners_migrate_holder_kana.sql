-- 既存の bank_account_holder にカナが入っている行を bank_account_holder_kana に移す
-- 旧フォームは「名義（カナ）」として bank_account_holder にカタカナを保存していた。
-- 全文字がカタカナ・全角/半角スペース・長音記号のみで構成される行のみ kana 側へ移し、
-- 漢字混じりの値はそのまま漢字フィールドに残す。
update public.owners
set
  bank_account_holder_kana = bank_account_holder,
  bank_account_holder = null
where bank_account_holder is not null
  and bank_account_holder_kana is null
  and bank_account_holder ~ '^[ァ-ヶー　 ]+$';
