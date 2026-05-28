import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// 駅サジェストAPI
// 駅マスタ（stations）を駅名の前方一致で検索し、路線名つきで返す。
// 駅マスタは全社共通の参照データなので company_id でのフィルタは不要。
//
// 使い方: GET /api/stations?q=しんじゅく
// レスポンス: { stations: [{ station_cd, station_name, line_name, company_name }] }

export interface StationOption {
  station_cd: string;
  station_name: string;
  line_name: string | null;
  company_name: string | null;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (q.length < 1) {
    return NextResponse.json({ stations: [] });
  }

  try {
    const supabase = await createClient();

    // 前方一致候補を広めに拾い、station_g_cd（駅グループ=乗換駅）の路線数で主要駅を上位に並べ直す。
    // 並び順: 完全一致 → station_g_cd 路線数 降順 → 駅名 昇順。
    const { data, error } = await supabase
      .from("stations")
      .select("station_cd, station_name, station_g_cd, train_lines(line_name, company_name)")
      .ilike("station_name", `${q}%`)
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: "駅の検索に失敗しました" },
        { status: 500 }
      );
    }

    // station_g_cd ごとに「同名扱いの路線数」を数えてターミナル度合いを近似
    const groupCount = new Map<string, number>();
    for (const row of data ?? []) {
      const g = (row as any).station_g_cd;
      if (!g) continue;
      groupCount.set(g, (groupCount.get(g) ?? 0) + 1);
    }

    const ranked = (data ?? [])
      .map((row: any) => ({
        station_cd: row.station_cd,
        station_name: row.station_name,
        station_g_cd: row.station_g_cd,
        line_name: row.train_lines?.line_name ?? null,
        company_name: row.train_lines?.company_name ?? null,
        _exact: row.station_name === q ? 1 : 0,
        _terminal: row.station_g_cd ? (groupCount.get(row.station_g_cd) ?? 1) : 1,
      }))
      .sort((a, b) => {
        if (a._exact !== b._exact) return b._exact - a._exact;
        if (a._terminal !== b._terminal) return b._terminal - a._terminal;
        return a.station_name.localeCompare(b.station_name, "ja");
      })
      .slice(0, 30);

    const stations: StationOption[] = ranked.map(
      ({ station_cd, station_name, line_name, company_name }) => ({
        station_cd,
        station_name,
        line_name,
        company_name,
      })
    );

    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
