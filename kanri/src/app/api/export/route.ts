import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateCsv } from "@/lib/csv-export";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = any;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const supabase = await createClient();
    let csv = "";
    let filename = "export.csv";

    switch (type) {
      case "properties": {
        const { data } = await supabase
          .from("properties")
          .select("*, owner:owners(name), units(id, status)")
          .order("name");
        csv = generateCsv(data ?? [], [
          { key: "name", label: "物件名" },
          { key: "address", label: "住所" },
          { key: "property_type", label: "種別" },
          { key: "owner.name", label: "オーナー" },
          { key: "structure", label: "構造" },
          { key: "built_year", label: "築年" },
          { key: "floors", label: "階数" },
          { key: "nearest_station", label: "最寄り駅" },
          {
            key: "units",
            label: "総戸数",
            format: (v: Row[]) => String(v?.length ?? 0),
          },
          {
            key: "units",
            label: "入居数",
            format: (v: Row[]) =>
              String(v?.filter((u: Row) => u.status === "occupied")?.length ?? 0),
          },
        ]);
        filename = "properties.csv";
        break;
      }

      case "tenants": {
        const { data } = await supabase
          .from("tenants")
          .select("*")
          .order("name");
        csv = generateCsv(data ?? [], [
          { key: "name", label: "氏名" },
          { key: "name_kana", label: "フリガナ" },
          { key: "phone", label: "電話番号" },
          { key: "email", label: "メール" },
          { key: "workplace", label: "勤務先" },
          { key: "emergency_contact_name", label: "緊急連絡先（氏名）" },
          { key: "emergency_contact_phone", label: "緊急連絡先（電話）" },
        ]);
        filename = "tenants.csv";
        break;
      }

      case "rent": {
        const { data } = await supabase
          .from("rent_billings")
          .select(
            "*, contract:contracts(tenant:tenants(name), unit:units(unit_number, property:properties(name)))"
          )
          .order("billing_month", { ascending: false });
        csv = generateCsv(data ?? [], [
          { key: "billing_month", label: "対象月" },
          { key: "contract.tenant.name", label: "入居者" },
          { key: "contract.unit.property.name", label: "物件" },
          { key: "contract.unit.unit_number", label: "部屋" },
          { key: "rent", label: "賃料" },
          { key: "management_fee", label: "管理費" },
          { key: "total_amount", label: "合計" },
          { key: "due_date", label: "支払期限" },
          { key: "status", label: "状態" },
        ]);
        filename = "rent_billings.csv";
        break;
      }

      default:
        return NextResponse.json(
          { error: "無効なエクスポート種別です" },
          { status: 400 }
        );
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "エクスポートに失敗しました" },
      { status: 500 }
    );
  }
}
