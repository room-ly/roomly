import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";

// PATCH: 費用の支払先(payee_id)だけを更新する軽量エンドポイント。
// 振込バッチ作成画面で「支払先未設定の費用にその場で支払先を割り当てる」用途。
// 通常の費用編集(PUT)は承認済みをロックするが、支払先の割当は金額・負担に影響しない
// メタ情報なので、承認済み・未払いの費用に対しても許可する。
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("expenses:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const payeeId = body?.payee_id;
    if (!payeeId || typeof payeeId !== "string") {
      return NextResponse.json({ error: "支払先を指定してください" }, { status: 400 });
    }

    const supabase = await createClient();
    const company_id = await getCompanyId();

    // 対象の費用が存在し、まだ支払っていない（paid_at が空）ことを確認する。
    // 支払済みの費用の支払先を後から変えるのは事故の元なので拒否する。
    const { data: existing } = await supabase
      .from("expenses")
      .select("id, paid_at")
      .eq("id", id)
      .eq("company_id", company_id)
      .single();
    if (!existing) return NextResponse.json({ error: "費用が見つかりません" }, { status: 404 });
    if (existing.paid_at) {
      return NextResponse.json({ error: "支払済みの費用の支払先は変更できません" }, { status: 403 });
    }

    // 支払先が自社のものか検証
    const { data: payee } = await supabase
      .from("payees")
      .select("id")
      .eq("id", payeeId)
      .eq("company_id", company_id)
      .single();
    if (!payee) return NextResponse.json({ error: "支払先が見つかりません" }, { status: 404 });

    const { error } = await supabase
      .from("expenses")
      .update({ payee_id: payeeId })
      .eq("id", id)
      .eq("company_id", company_id);
    if (error) return NextResponse.json({ error: "支払先の設定に失敗しました" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
