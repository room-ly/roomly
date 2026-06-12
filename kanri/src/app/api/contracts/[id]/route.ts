import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, getCurrentUserRole, requirePermission } from "@/lib/supabase-server";
import { contractSchema } from "@/lib/schemas";
import { previewDeletion, deleteContractsCascade } from "@/lib/contract-deletion";

// 削除前の依存件数プレビュー（確認モーダルで「請求6件・入金1件が消えます」を表示するため）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("contracts:delete");
    if (denied) return denied;
    if (new URL(request.url).searchParams.get("preview") !== "1") {
      return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
    }
    const { id } = await params;
    const companyId = await getCompanyId();
    const preview = await previewDeletion([id], companyId);
    if ("error" in preview) {
      return NextResponse.json({ error: "件数の取得に失敗しました" }, { status: 500 });
    }
    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("contracts:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const parsed = contractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    // date型カラムは空文字をnullに正規化する（""はPostgresのdate変換でエラーになる）
    const data = {
      ...parsed.data,
      end_date: parsed.data.end_date || null,
      move_out_date: parsed.data.move_out_date || null,
      signed_date: parsed.data.signed_date || null,
      important_explanation_date: parsed.data.important_explanation_date || null,
      renewal_effective_date: parsed.data.renewal_effective_date || null,
      renewal_end_date: parsed.data.renewal_end_date || null,
    };

    const { data: oldContract } = await supabase
      .from("contracts")
      .select("move_out_date")
      .eq("id", id)
      .eq("company_id", companyId)
      .single();

    const { data: contract, error } = await supabase
      .from("contracts")
      .update(data)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "契約の更新に失敗しました" },
        { status: 500 }
      );
    }

    if (data.move_out_date && data.move_out_date !== oldContract?.move_out_date) {
      const { data: requests } = await supabase
        .from("move_out_requests")
        .select("id, desired_move_out_date, change_log")
        .eq("contract_id", id)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) {
        const req = requests[0];
        const oldDate = req.desired_move_out_date || oldContract?.move_out_date || "未設定";
        const now = new Date().toISOString().slice(0, 10);
        const entry = `${now}: ${oldDate} → ${data.move_out_date}`;
        const log = req.change_log ? `${req.change_log}\n${entry}` : entry;

        await supabase
          .from("move_out_requests")
          .update({
            desired_move_out_date: data.move_out_date,
            change_log: log,
            updated_at: new Date().toISOString(),
          })
          .eq("id", req.id);
      }
    }

    return NextResponse.json(contract);
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("contracts:delete");
    if (denied) return denied;

    const { id } = await params;
    const companyId = await getCompanyId();
    const current = await getCurrentUserRole();
    if (!current) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 入金履歴があれば論理削除、無ければ子→親の物理カスケード削除
    const result = await deleteContractsCascade({
      contractIds: [id],
      companyId,
      actorId: current.user_id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "契約の削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, mode: result.mode });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
