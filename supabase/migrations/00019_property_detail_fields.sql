-- 物件詳細フィールド追加（ATBB・SUUMO準拠）

-- 基本情報
alter table public.properties add column if not exists name_kana text;
alter table public.properties add column if not exists property_code text;

-- 所在地詳細
alter table public.properties add column if not exists prefecture text;
alter table public.properties add column if not exists city text;
alter table public.properties add column if not exists town text;
alter table public.properties add column if not exists building_number text;
alter table public.properties add column if not exists latitude numeric(10,7);
alter table public.properties add column if not exists longitude numeric(10,7);

-- 交通（2路線目・3路線目）
alter table public.properties add column if not exists nearest_station_2 text;
alter table public.properties add column if not exists walk_minutes_2 int;
alter table public.properties add column if not exists nearest_station_3 text;
alter table public.properties add column if not exists walk_minutes_3 int;
alter table public.properties add column if not exists bus_station text;
alter table public.properties add column if not exists bus_minutes int;

-- 建物詳細
alter table public.properties add column if not exists underground_floors int;
alter table public.properties add column if not exists total_area_sqm numeric(10,2);
alter table public.properties add column if not exists building_area_sqm numeric(10,2);
alter table public.properties add column if not exists land_area_sqm numeric(10,2);
alter table public.properties add column if not exists built_month int;
alter table public.properties add column if not exists renovation_year int;
alter table public.properties add column if not exists renovation_month int;

-- 管理・設備
alter table public.properties add column if not exists management_form text;
alter table public.properties add column if not exists management_company text;
alter table public.properties add column if not exists parking text;
alter table public.properties add column if not exists parking_fee numeric(10,0);
alter table public.properties add column if not exists bicycle_parking text;
alter table public.properties add column if not exists bike_parking text;

-- 共用設備
alter table public.properties add column if not exists common_facilities text[];

-- 用途地域・法規
alter table public.properties add column if not exists land_use_zone text;
alter table public.properties add column if not exists land_rights text;
alter table public.properties add column if not exists building_coverage_ratio numeric(5,2);
alter table public.properties add column if not exists floor_area_ratio numeric(5,2);
alter table public.properties add column if not exists zoning text;

-- 取引
alter table public.properties add column if not exists transaction_type text;

-- 自由入力
alter table public.properties add column if not exists appeal_points text;
alter table public.properties add column if not exists internal_memo text;
