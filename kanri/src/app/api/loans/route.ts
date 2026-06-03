import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { getLoans } from "@/lib/queries/loans";
import { normalizeLoanInput } from "@/lib/loan-input";
import type { TablesInsert } from "@/lib/database.types";

// ローン一覧
export async function GET() {
  const denied = await requirePermission("loans:read");
  if (denied) return denied;
  try {
    const loans = await getLoans();
    return NextResponse.json(loans);
  } catch {
    return NextResponse.json({ error: "ローンの取得に失敗しました" }, { status: 500 });
  }
}

// ローン作成（紐付け物件も同時保存）
export async function POST(request: NextRequest) {
  const denied = await requirePermission("loans:create");
  if (denied) return denied;
  try {
    const body = await request.json();
    if (!body.name || !body.lender_name || !body.principal_amount) {
      return NextResponse.json(
        { error: "ローン名・借入先・借入元本は必須です" },
        { status: 400 },
      );
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();

    const input = normalizeLoanInput(body);
    const { data: loan, error } = await supabase
      .from("loans")
      .insert({ ...input, company_id } as TablesInsert<"loans">)
      .select()
      .single();
    if (error || !loan) {
      return NextResponse.json({ error: "ローンの作成に失敗しました" }, { status: 500 });
    }

    // 紐付け物件（多対多）
    const propertyIds: string[] = Array.isArray(body.property_ids) ? body.property_ids : [];
    if (propertyIds.length > 0) {
      const ratios: Record<string, number> = body.allocation_ratios ?? {};
      const links = propertyIds.map((pid) => ({
        company_id,
        loan_id: loan.id,
        property_id: pid,
        allocation_ratio: ratios[pid] != null ? Number(ratios[pid]) : null,
      }));
      await supabase.from("loan_properties").insert(links as TablesInsert<"loan_properties">[]);
    }

    return NextResponse.json(loan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
