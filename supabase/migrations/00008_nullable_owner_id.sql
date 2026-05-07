-- owner_idをNULLABLEに変更（オーナー未登録状態で物件追加を可能にする）
ALTER TABLE public.properties ALTER COLUMN owner_id DROP NOT NULL;
