import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { tenantSchema } from "@/lib/schemas";
import type { TablesUpdate } from "@/lib/database.types";
import { previewDeletion, deleteContractsCascade } from "@/lib/contract-deletion";

// 入居者に紐づく契約IDを取得（プレビュー・削除の両方で使う）
async function getTenantContractIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  companyId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("contracts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("company_id", companyId);
  return (data ?? []).map((c) => c.id);
}

// 削除前の依存件数プレビュー
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("tenants:delete");
    if (denied) return denied;
    if (new URL(request.url).searchParams.get("preview") !== "1") {
      return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
    }
    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();
    const contractIds = await getTenantContractIds(supabase, id, companyId);
    const preview = await previewDeletion(supabase, contractIds, companyId);
    return NextResponse.json({ ...preview, contracts: contractIds.length });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("tenants:edit");
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const parsed = tenantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const companyId = await getCompanyId();
    const data = Object.fromEntries(
      Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
    );

    const { data: tenant, error } = await supabase
      .from("tenants")
      .update(data as TablesUpdate<"tenants">)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();

    if (error) {
      console.error("tenants update error", error);
      return NextResponse.json(
        { error: `入居者の更新に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(tenant);
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
    const denied = await requirePermission("tenants:delete");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    // 入居者に紐づく契約とその子を一括処理。入金履歴があれば論理削除、無ければ物理削除。
    const contractIds = await getTenantContractIds(supabase, id, companyId);
    const result = await deleteContractsCascade({
      supabase,
      contractIds,
      tenantId: id,
      companyId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "入居者の削除に失敗しました" },
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
