#!/usr/bin/env python3
"""
駅・路線マスタ seed マイグレーション生成スクリプト

国土数値情報 鉄道データ(N02) の GeoJSON から、
train_lines / stations テーブルへの seed SQL を生成する。

データ出典:
  国土交通省 国土数値情報（鉄道データ N02・令和6年度=2024年版）
  https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html
  政府標準利用規約（出典明記で商用利用可）

更新手順（年1回程度）:
  1. 上記ページから N02-YY_GML.zip をDL・解凍
  2. UTF-8/N02-YY_Station.geojson を入力に本スクリプトを実行
     python3 scripts/build_station_master.py <station.geojson> > supabase/migrations/00047_station_master_seed.sql
  3. 生成された SQL をマイグレーションとして適用

N02 属性:
  N02_003 = 路線名 / N02_004 = 運営会社 / N02_005 = 駅名
  N02_005c = 駅コード(主キー) / N02_005g = 駅グループコード(乗換名寄せ)
  geometry = LineString(ホーム線形) → 全頂点の重心を駅座標とする
"""
import json
import sys
import hashlib
from collections import defaultdict


def line_cd(company: str, line_name: str) -> int:
    """事業者名+路線名から安定した路線コードを合成（N02に路線コードがないため）"""
    h = hashlib.md5(f"{company}\t{line_name}".encode("utf-8")).hexdigest()
    # 正の31bit整数に収める
    return int(h[:8], 16) & 0x7FFFFFFF


def sql_str(s):
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("usage: build_station_master.py <N02-YY_Station.geojson>\n")
        sys.exit(1)

    data = json.load(open(sys.argv[1], encoding="utf-8"))
    feats = data["features"]

    # 路線: (company, line_name) -> {line_cd, lon/lat 集約}
    lines = {}
    line_pts = defaultdict(lambda: [0.0, 0.0, 0])  # sum_lon, sum_lat, n

    # 駅: station_cd -> 集約データ
    stations = {}
    st_pts = defaultdict(lambda: [0.0, 0.0, 0])

    def add_pts(acc, coords):
        # LineString or MultiLineString の全頂点を加算
        if not coords:
            return
        if isinstance(coords[0][0], (int, float)):
            seq = coords  # LineString
        else:
            seq = [pt for seg in coords for pt in seg]  # MultiLineString
        for lon, lat in seq:
            acc[0] += lon
            acc[1] += lat
            acc[2] += 1

    for f in feats:
        p = f["properties"]
        company = p.get("N02_004")
        line_name = p.get("N02_003")
        st_name = p.get("N02_005")
        st_cd = p.get("N02_005c")
        st_g = p.get("N02_005g")
        pref_cd = p.get("N02_001")  # 都道府県コード
        coords = f["geometry"]["coordinates"]

        lcd = line_cd(company, line_name)
        if lcd not in lines:
            lines[lcd] = {"company": company, "line_name": line_name}
        add_pts(line_pts[lcd], coords)

        if st_cd not in stations:
            stations[st_cd] = {
                "name": st_name,
                "line_cd": lcd,
                "group_cd": st_g,
                "pref_cd": pref_cd,
            }
        add_pts(st_pts[st_cd], coords)

    def centroid(acc):
        if acc[2] == 0:
            return ("NULL", "NULL")
        return (f"{acc[0]/acc[2]:.7f}", f"{acc[1]/acc[2]:.7f}")

    out = sys.stdout.write
    out("-- 00048 駅・路線マスタ seed\n")
    out("-- 出典: 国土交通省 国土数値情報（鉄道データ N02・2024年版）\n")
    out("--   https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2024.html\n")
    out("--   政府標準利用規約（出典明記で商用利用可）\n")
    out("-- 生成: scripts/build_station_master.py\n\n")
    out("begin;\n\n")
    # cascade を使わずマスタ2テーブルのみを安全に初期化する。
    # （truncate cascade は properties.nearest_station_id 経由で業務テーブルを巻き込むため厳禁）
    # 子(stations)→親(train_lines) の順で delete。
    out("delete from public.stations;\n")
    out("delete from public.train_lines;\n\n")

    # train_lines
    out("insert into public.train_lines (line_cd, company_name, line_name, lon, lat) values\n")
    rows = []
    for lcd, v in sorted(lines.items()):
        lon, lat = centroid(line_pts[lcd])
        rows.append(
            f"({lcd}, {sql_str(v['company'])}, {sql_str(v['line_name'])}, {lon}, {lat})"
        )
    out(",\n".join(rows))
    out(";\n\n")

    # stations
    out(
        "insert into public.stations "
        "(station_cd, station_name, line_cd, station_g_cd, pref_cd, lon, lat) values\n"
    )
    rows = []
    for scd, v in sorted(stations.items()):
        lon, lat = centroid(st_pts[scd])
        rows.append(
            f"({sql_str(scd)}, {sql_str(v['name'])}, {v['line_cd']}, "
            f"{sql_str(v['group_cd'])}, {sql_str(v['pref_cd'])}, {lon}, {lat})"
        )
    out(",\n".join(rows))
    out(";\n\n")

    out("commit;\n")

    sys.stderr.write(
        f"lines={len(lines)} stations={len(stations)}\n"
    )


if __name__ == "__main__":
    main()
