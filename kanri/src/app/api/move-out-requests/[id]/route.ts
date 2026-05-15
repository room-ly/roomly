import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { status, review_notes } = body;
    if (!["approved", "rejected", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "無効なステータスです" },
        { status: 400 }
      );
    }

    // ユーザーIDを取得
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("move_out_requests")
      .update({
        status,
        review_notes: review_notes || null,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, contract:contracts(id, unit_id)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 承認時は契約のmove_out_dateも更新
    if (status === "approved" && data) {
      const moveOutReq = await supabase
        .from("move_out_requests")
        .select("desired_move_out_date, contract_id")
        .eq("id", id)
        .single();

      if (moveOutReq.data) {
        await supabase
          .from("contracts")
          .update({
            move_out_date: moveOutReq.data.desired_move_out_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", moveOutReq.data.contract_id);
      }
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
