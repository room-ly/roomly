import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, action_type } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "内容を入力してください" }, { status: 400 });
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data, error } = await supabase
      .from("inquiry_logs")
      .insert({
        inquiry_id: id,
        company_id: companyId,
        action_type: action_type || "staff_reply",
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "対応ログの追加に失敗しました" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
