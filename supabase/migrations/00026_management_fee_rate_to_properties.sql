-- 管理手数料率をオーナー単位から物件単位に移動
-- 既存データはオーナーの手数料率をコピーして引き継ぐ

ALTER TABLE public.properties
  ADD COLUMN management_fee_rate numeric(5,2) NOT NULL DEFAULT 5.00;

-- 既存物件にオーナーの手数料率をコピー
UPDATE public.properties p
SET management_fee_rate = o.management_fee_rate
FROM public.owners o
WHERE p.owner_id = o.id;

-- オーナーテーブルから手数料率カラムを削除
ALTER TABLE public.owners DROP COLUMN management_fee_rate;
