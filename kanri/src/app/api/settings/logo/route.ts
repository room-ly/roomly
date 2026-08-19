import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/lib/database.types";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

// POST: ロゴのアップロード（既存ロゴは差し替え）
export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const supabase = await createClient();
    const companyId = await getCompanyId();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPEG、PNG、WebP、SVGのみ対応しています" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "2MB以下のファイルのみアップロードできます" },
        { status: 400 }
      );
    }

    // 差し替え前に既存ロゴのパスを控えておく（アップロード成功後に削除する）
    const { data: current } = await supabase
      .from("companies")
      .select("logo_path")
      .eq("id", companyId)
      .single();
    const oldPath = (current as { logo_path?: string | null } | null)?.logo_path ?? null;

    const ext = EXT_BY_TYPE[file.type] ?? "png";
    const storagePath = `${companyId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_path: storagePath } as TablesUpdate<"companies">)
      .eq("id", companyId);

    if (updateError) {
      // DB更新に失敗した場合、孤児ファイルを残さないよう掃除する
      await supabase.storage.from("company-logos").remove([storagePath]);
      return NextResponse.json({ error: "ロゴの保存に失敗しました" }, { status: 500 });
    }

    if (oldPath && oldPath !== storagePath) {
      await supabase.storage.from("company-logos").remove([oldPath]);
    }

    return NextResponse.json({
      success: true,
      logo_path: storagePath,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/company-logos/${storagePath}`,
    });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

// DELETE: ロゴの削除
export async function DELETE() {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: current } = await supabase
      .from("companies")
      .select("logo_path")
      .eq("id", companyId)
      .single();
    const path = (current as { logo_path?: string | null } | null)?.logo_path ?? null;

    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_path: null } as TablesUpdate<"companies">)
      .eq("id", companyId);

    if (updateError) {
      return NextResponse.json({ error: "ロゴの削除に失敗しました" }, { status: 500 });
    }

    if (path) {
      await supabase.storage.from("company-logos").remove([path]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}
