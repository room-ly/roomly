import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { payeeSchema } from "@/lib/schemas-payee";

export async function GET() {
  try {
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { data, error } = await supabase
      .from("payees")
      .select("*")
      .eq("company_id", company_id)
      .order("name");
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("expenses:create");
    if (denied) return denied;

    const body = await request.json();
    const parsed = payeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const company_id = await getCompanyId();
    const { data, error } = await supabase
      .from("payees")
      .insert({ ...parsed.data, company_id })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}
