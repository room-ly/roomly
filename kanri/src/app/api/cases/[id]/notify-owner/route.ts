import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { sendMaintenanceNotification } from "@/lib/notifications";

// 対応案件のオーナー宛メール通知。
// 担当者が案件詳細画面のボタンから手動で送る（全件自動送信はオーナーにとってノイズになるため）。
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await getCompanyId();

    const { data: row, error } = await supabase
      .from("cases")
      .select(
        "id, title, priority, unit:units(unit_number), property:properties(name, owner:owners(name, email))"
      )
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "対応案件が見つかりません" }, { status: 404 });
    }

    const caseRow = row as Record<string, any>;
    const owner = caseRow.property?.owner;
    if (!owner?.email) {
      return NextResponse.json(
        { error: "オーナーのメールアドレスが登録されていません" },
        { status: 400 }
      );
    }

    await sendMaintenanceNotification({
      to: owner.email,
      ownerName: owner.name ?? "",
      propertyName: caseRow.property?.name ?? "",
      unitNumber: caseRow.unit?.unit_number ?? "",
      title: caseRow.title ?? "",
      priority: caseRow.priority ?? "normal",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }
}
