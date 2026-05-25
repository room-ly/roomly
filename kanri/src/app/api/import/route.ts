import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import {
  parseCsv,
  mapRowToDb,
  PROPERTY_COLUMNS,
  TENANT_COLUMNS,
  UNIT_COLUMNS,
} from "@/lib/csv-import";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, csvText, property_id } = body as {
      type: string;
      csvText: string;
      property_id?: string;
    };

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
          : type === "units"
            ? UNIT_COLUMNS
            : null;

    if (!columns) {
      return NextResponse.json(
        { error: "無効なインポート種別です（properties / tenants / units）" },
        { status: 400 }
      );
    }

    // 部屋インポートは物件IDが必須
    if (type === "units" && !property_id) {
      return NextResponse.json(
        { error: "部屋のインポートには物件IDが必要です" },
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
        type as "properties" | "tenants" | "units"
      );
      if (errors.length > 0) {
        rowErrors.push({ row: i + 2, errors }); // +2: ヘッダー行 + 0-index
      } else {
        validRows.push(data);
      }
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    // 部屋インポートの追加チェック（プラン上限・部屋番号重複）
    if (type === "units") {
      // CSV内で複数回出現する部屋番号を特定（出現する全行をエラー扱いし登録しない）
      const counts = new Map<string, number>();
      for (const row of validRows) {
        const num = String(row.unit_number);
        counts.set(num, (counts.get(num) ?? 0) + 1);
      }
      const dupNumbers = new Set(
        [...counts.entries()].filter(([, c]) => c > 1).map(([num]) => num)
      );

      // 既存DBの同一物件内の部屋番号と突合
      const { data: existing } = await supabase
        .from("units")
        .select("unit_number")
        .eq("property_id", property_id!);
      const existingNumbers = new Set(
        (existing ?? []).map((u) => String(u.unit_number))
      );

      const filtered: Record<string, unknown>[] = [];
      validRows.forEach((row, idx) => {
        const num = String(row.unit_number);
        if (dupNumbers.has(num)) {
          rowErrors.push({
            row: idx + 2,
            errors: [`部屋番号「${num}」がCSV内で重複しています`],
          });
          return;
        }
        if (existingNumbers.has(num)) {
          rowErrors.push({
            row: idx + 2,
            errors: [`部屋番号「${num}」は既にこの物件に存在します`],
          });
          return;
        }
        filtered.push(row);
      });
      validRows.length = 0;
      validRows.push(...filtered);

      // プラン上限チェック（会社全体の区画数 + 今回追加分）
      const [companyRes, unitsRes] = await Promise.all([
        supabase
          .from("companies")
          .select(
            "max_units, subscription_status, subscription_current_period_end"
          )
          .eq("id", company_id)
          .single(),
        supabase.from("units").select("id", { count: "exact", head: true }),
      ]);
      const comp = companyRes.data;
      const isSubActive =
        comp?.subscription_status === "active" &&
        (!comp.subscription_current_period_end ||
          new Date(comp.subscription_current_period_end) > new Date());
      const effectiveMax = isSubActive ? (comp?.max_units ?? 50) : 10;
      const currentUnits = unitsRes.count ?? 0;
      const remaining = effectiveMax - currentUnits;
      if (validRows.length > remaining) {
        return NextResponse.json(
          {
            error: isSubActive
              ? `現在のプランの区画数上限（${effectiveMax}区画）を超えます。残り${Math.max(remaining, 0)}区画まで登録できます。`
              : `フリープランの上限（10区画）を超えます。残り${Math.max(remaining, 0)}区画まで登録できます。プロプランにアップグレードしてください。`,
            rowErrors: rowErrors.length > 0 ? rowErrors : undefined,
          },
          { status: 403 }
        );
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

    const tableName =
      type === "properties"
        ? "properties"
        : type === "units"
          ? "units"
          : "tenants";
    // 空欄（null）のキーは送らず、DBのカラム既定値に委ねる。
    // NOT NULL かつ DEFAULT 付きのカラム（例: management_fee_rate）に
    // null を渡して制約違反になるのを防ぐ。
    const rowsWithCompany = validRows.map((row) => {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (v !== null && v !== undefined) cleaned[k] = v;
      }
      return {
        ...cleaned,
        company_id,
        ...(type === "units" ? { property_id } : {}),
      };
    });

    // defaultToNull:false で、行ごとに欠けたキーをNULLではなくカラム既定値で埋める。
    // （PostgRESTの一括INSERTは既定でキーを全行で揃えNULL補完するため、
    //  NOT NULL + DEFAULT のカラム（例: management_fee_rate）で制約違反になる）
    const { data: inserted, error: dbError } = await supabase
      .from(tableName as any)
      .insert(rowsWithCompany as any, { defaultToNull: false })
      .select();

    if (dbError) {
      return NextResponse.json(
        { error: "データの登録に失敗しました" },
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
