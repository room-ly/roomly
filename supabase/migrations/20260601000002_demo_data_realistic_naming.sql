-- デモデータをよりリアル感のある全国の地名に差し替える。
--
-- 背景:
--   既存のデモ物件は全棟が東京（新宿/中野/杉並/渋谷）に集中していて、
--   実在感が薄く「自分の物件もこう管理できる」と読者が想像しにくい。
--   広告着地→デモ体験のCVR向上のため、4棟を主要都市にバラけさせ、
--   オーナー3名の取引銀行・支店も地域に整合させる。
--
-- 注意:
--   reset_demo_data() 関数は cases_overhaul 以降のスキーマ変更に追従できていない
--   既知の壊れた状態がある。本マイグレーションでは関数には触れず、
--   現在のデモデータ（properties / owners）を UPDATE で書き換えるのみ。
--   reset_demo_data 関数の修正は別件のタスクとして扱う。

-- 物件 4棟: 東京(中野) / 大阪(梅田) / 名古屋(栄) / 福岡(博多)
update public.properties
   set name = 'グランメゾン中野', address = '東京都中野区中央2-3-4', nearest_station = '中野駅'
 where id = 'c0000000-0000-0000-0000-000000000001';

update public.properties
   set name = 'リバーサイド梅田', address = '大阪府大阪市北区梅田3-1-3', nearest_station = '梅田駅'
 where id = 'c0000000-0000-0000-0000-000000000002';

update public.properties
   set name = 'サンライズ栄', address = '愛知県名古屋市中区栄3-5-12', nearest_station = '栄駅'
 where id = 'c0000000-0000-0000-0000-000000000003';

update public.properties
   set name = 'パークハイツ博多', address = '福岡県福岡市博多区博多駅前2-1-1', nearest_station = '博多駅'
 where id = 'c0000000-0000-0000-0000-000000000004';

-- 物件のオーナー紐付けを地域配分（大阪・名古屋を別オーナーに分散）
update public.properties
   set owner_id = 'b0000000-0000-0000-0000-000000000002'
 where id = 'c0000000-0000-0000-0000-000000000002';

update public.properties
   set owner_id = 'b0000000-0000-0000-0000-000000000003'
 where id = 'c0000000-0000-0000-0000-000000000003';

-- オーナーの取引銀行・支店も地域に整合
update public.owners
   set bank_name = '三菱UFJ銀行', bank_branch = '中野支店', bank_code = '0005', bank_branch_code = '341'
 where id = 'b0000000-0000-0000-0000-000000000001';

update public.owners
   set bank_name = '三井住友銀行', bank_branch = '梅田支店', bank_code = '0009', bank_branch_code = '259'
 where id = 'b0000000-0000-0000-0000-000000000002';

update public.owners
   set bank_name = 'みずほ銀行', bank_branch = '名古屋支店', bank_code = '0001', bank_branch_code = '001'
 where id = 'b0000000-0000-0000-0000-000000000003';
