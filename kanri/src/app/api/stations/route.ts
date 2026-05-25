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

    // 駅名の前方一致 → 部分一致の順で拾うため ilike。
    // 路線名は train_lines を join して取得。
    const { data, error } = await supabase
      .from("stations")
      .select("station_cd, station_name, train_lines(line_name, company_name)")
      .ilike("station_name", `${q}%`)
      .order("station_name")
      .limit(30);

    if (error) {
      return NextResponse.json(
        { error: "駅の検索に失敗しました" },
        { status: 500 }
      );
    }

    const stations: StationOption[] = (data ?? []).map((row: any) => ({
      station_cd: row.station_cd,
      station_name: row.station_name,
      line_name: row.train_lines?.line_name ?? null,
      company_name: row.train_lines?.company_name ?? null,
    }));

    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
