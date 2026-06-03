import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { getLoanDetail } from "@/lib/queries/loans";
import { normalizeLoanInput } from "@/lib/loan-input";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";

// ローン詳細（返済予定表付き）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:read");
  if (denied) return denied;
  const { id } = await params;
  const detail = await getLoanDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "ローンが見つかりません" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

// ローン更新（紐付け物件を入れ替え）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:edit");
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const input = normalizeLoanInput(body);
    const { data: loan, error } = await supabase
      .from("loans")
      .update(input as TablesUpdate<"loans">)
      .eq("id", id)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error || !loan) {
      return NextResponse.json({ error: "ローンの更新に失敗しました" }, { status: 500 });
    }

    // 紐付け物件を入れ替え（指定がある場合のみ）
    if (Array.isArray(body.property_ids)) {
      await supabase.from("loan_properties").delete().eq("loan_id", id).eq("company_id", company_id);
      const propertyIds: string[] = body.property_ids;
      if (propertyIds.length > 0) {
        const ratios: Record<string, number> = body.allocation_ratios ?? {};
        const links = propertyIds.map((pid) => ({
          company_id,
          loan_id: id,
          property_id: pid,
          allocation_ratio: ratios[pid] != null ? Number(ratios[pid]) : null,
        }));
        await supabase.from("loan_properties").insert(links as TablesInsert<"loan_properties">[]);
      }
    }

    return NextResponse.json(loan);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// ローン削除（返済予定表・紐付けはCASCADEで自動削除）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requirePermission("loans:delete");
  if (denied) return denied;
  try {
    const { id } = await params;
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { error } = await supabase
      .from("loans")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);
    if (error) {
      return NextResponse.json({ error: "ローンの削除に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
