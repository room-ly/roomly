import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { sendMaintenanceNotification } from "@/lib/notifications";

// 修繕依頼のオーナー宛メール通知。
// 担当者が修繕詳細画面のボタンから手動で送る（全件自動送信はオーナーにとってノイズになるため）。
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    await getCompanyId(); // 認証チェック（RLSでテナント分離も担保）

    // 物件経由でオーナーのメールアドレスを辿る
    const { data: req, error } = await supabase
      .from("maintenance_requests")
      .select(
        "id, title, priority, unit:units(unit_number), property:properties(name, owner:owners(name, email))"
      )
      .eq("id", id)
      .single();

    if (error || !req) {
      return NextResponse.json({ error: "修繕依頼が見つかりません" }, { status: 404 });
    }

    const row = req as Record<string, any>;
    const owner = row.property?.owner;
    if (!owner?.email) {
      return NextResponse.json(
        { error: "オーナーのメールアドレスが登録されていません" },
        { status: 400 }
      );
    }

    await sendMaintenanceNotification({
      to: owner.email,
      ownerName: owner.name ?? "",
      propertyName: row.property?.name ?? "",
      unitNumber: row.unit?.unit_number ?? "",
      title: row.title ?? "",
      priority: row.priority ?? "normal",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }
}
