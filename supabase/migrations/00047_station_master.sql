-- 駅・路線マスタ
-- 全社共通の参照データ（company_id を持たない）。
-- データは scripts/build_station_master.py が生成する seed(00048) で投入する。
-- 出典: 国土交通省 国土数値情報（鉄道データ N02・2024年版）

-- 路線マスタ
create table if not exists public.train_lines (
  line_cd      integer primary key,        -- 事業者名+路線名から合成した安定コード
  company_name text,                       -- 運営会社（N02_004）
  line_name    text not null,              -- 路線名（N02_003）例: JR山手線
  lon          numeric(10,7),              -- 路線重心（参考）
  lat          numeric(10,7),
  created_at   timestamptz default now()
);

-- 駅マスタ
create table if not exists public.stations (
  station_cd   text primary key,           -- 駅コード（N02_005c）
  station_name text not null,              -- 駅名（N02_005）例: 新宿
  line_cd      integer references public.train_lines(line_cd),
  station_g_cd text,                        -- 駅グループコード（N02_005g）乗換駅の名寄せ用
  pref_cd      text,                        -- 都道府県コード（N02_001）
  lon          numeric(10,7),              -- 駅座標（ホーム線形の重心）
  lat          numeric(10,7),
  created_at   timestamptz default now()
);

-- サジェスト・絞り込み用インデックス
create index if not exists idx_stations_name on public.stations (station_name);
create index if not exists idx_stations_line on public.stations (line_cd);
create index if not exists idx_stations_g_cd on public.stations (station_g_cd);

-- RLS: 全ユーザー（authenticated / anon）に read 公開。書き込みは行わない（マイグレーションのみ）。
alter table public.train_lines enable row level security;
alter table public.stations enable row level security;

create policy "read_train_lines" on public.train_lines
  for select to authenticated, anon using (true);
create policy "read_stations" on public.stations
  for select to authenticated, anon using (true);

-- properties に駅マスタ参照を追加（既存の自由文字列 nearest_station* は残す＝非破壊）
alter table public.properties
  add column if not exists nearest_station_id   text references public.stations(station_cd),
  add column if not exists nearest_station_2_id text references public.stations(station_cd),
  add column if not exists nearest_station_3_id text references public.stations(station_cd);

create index if not exists idx_properties_nearest_station_id on public.properties (nearest_station_id);
