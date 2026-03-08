import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  parseCsv,
  mapRowToDb,
  PROPERTY_COLUMNS,
  TENANT_COLUMNS,
} from "@/lib/csv-import";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, csvText } = body as { type: string; csvText: string };

    if (!type || !csvText) {
      return NextResponse.json(
        { error: "typeとcsvTextは必須です" },
        { status: 400 }
      );
    }

    const columns =
      type === "properties"
        ? PROPERTY_COLUMNS
        : type === "tenants"
          ? TENANT_COLUMNS
          : null;

    if (!columns) {
      return NextResponse.json(
        { error: "無効なインポート種別です（properties / tenants）" },
        { status: 400 }
      );
    }

    // CSVパース
    const { rows, errors: parseErrors } = parseCsv(csvText);
    if (parseErrors.length > 0 && rows.length === 0) {
      return NextResponse.json(
        { error: "CSVの解析に失敗しました", details: parseErrors },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "インポートするデータがありません" },
        { status: 400 }
      );
    }

    // 行ごとにバリデーション・マッピング
    const validRows: Record<string, unknown>[] = [];
    const rowErrors: { row: number; errors: string[] }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { data, errors } = mapRowToDb(
        rows[i],
        columns,
        type as "properties" | "tenants"
      );
      if (errors.length > 0) {
        rowErrors.push({ row: i + 2, errors }); // +2: ヘッダー行 + 0-index
      } else {
        validRows.push(data);
      }
    }

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          error: "有効なデータがありません",
          rowErrors,
          parseErrors,
        },
        { status: 400 }
      );
    }

    // Supabaseに一括挿入
    const supabase = await createClient();
    const tableName = type === "properties" ? "properties" : "tenants";

    const { data: inserted, error: dbError } = await supabase
      .from(tableName)
      .insert(validRows)
      .select();

    if (dbError) {
      return NextResponse.json(
        { error: "データの登録に失敗しました", details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: inserted?.length ?? 0,
      skipped: rowErrors.length,
      rowErrors: rowErrors.length > 0 ? rowErrors : undefined,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
