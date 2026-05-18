-- ownersテーブルに銀行コード・支店コードを追加（全銀フォーマットCSV出力用）
alter table public.owners add column bank_code text;
alter table public.owners add column bank_branch_code text;
