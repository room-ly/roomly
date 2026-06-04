import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";

// 契約の敷金口座への手動トランザクション（取崩し / 返金 / 追加預り）。
// 退去時の原状回復精算や、在living中の充当などをここから記録する。
const schema = z
  .object({
    transaction_type: z.enum(["charge", "refund", "initial_deposit"]),
    amount: z.coerce.number().int().positive("金額は0より大きい値を入力してください"),
    occurred_at: z.string().min(1, "日付は必須です"),
    notes: z.string().max(500).optional().nullable(),
    // 取崩しの理由（charge のときのみ）
    reason: z.enum(["restoration", "unpaid_rent", "penalty", "other"]).optional().nullable(),
  })
  // reason は charge のときだけ意味を持つ。他の種別では無視して NULL にする。
  .transform((d) => ({
    ...d,
    reason: d.transaction_type === "charge" ? (d.reason ?? "other") : null,
  }));

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("contracts:edit");
    if (denied) return denied;

    const { id: contractId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 契約が自社のものか確認
    const { data: contract } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", contractId)
      .eq("company_id", companyId)
      .single();
    if (!contract) {
      return NextResponse.json({ error: "契約が見つかりません" }, { status: 404 });
    }

    const { data: tx, error } = await supabase
      .from("deposit_transactions")
      .insert({
        company_id: companyId,
        contract_id: contractId,
        amount: parsed.data.amount,
        transaction_type: parsed.data.transaction_type,
        occurred_at: parsed.data.occurred_at,
        notes: parsed.data.notes ?? null,
        reason: parsed.data.reason,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "記録に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(tx, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const denied = await requirePermission("contracts:edit");
    if (denied) return denied;

    const { id: contractId } = await params;
    const txId = new URL(request.url).searchParams.get("txId");
    if (!txId) {
      return NextResponse.json({ error: "txId が必要です" }, { status: 400 });
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();

    // 手動記録（expense_id / billing_id が無いもの）だけ削除可。
    // 経費・請求に紐づく自動生成トランザクションは元の経費/請求側で操作させる。
    const { data: existing } = await supabase
      .from("deposit_transactions")
      .select("id, expense_id, billing_id")
      .eq("id", txId)
      .eq("contract_id", contractId)
      .eq("company_id", companyId)
      .single();
    if (!existing) {
      return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
    }
    if (existing.expense_id || existing.billing_id) {
      return NextResponse.json(
        { error: "費用・請求に紐づく記録は元の画面から操作してください" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("deposit_transactions")
      .delete()
      .eq("id", txId)
      .eq("company_id", companyId);
    if (error) {
      return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
