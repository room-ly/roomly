-- 部屋の既存損傷・汚損メモ（重要事項説明書「既存の損傷・汚損の告知」欄に印字）
ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS damage_notes text;
