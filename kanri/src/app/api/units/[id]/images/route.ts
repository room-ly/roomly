import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGES_PER_UNIT = 10;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, file_path, file_size, mime_type, is_primary, created_at")
      .eq("unit_id", unitId)
      .eq("document_type", "photo")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "画像一覧の取得に失敗しました" }, { status: 500 });
    }

    const images = (data ?? []).map((doc) => ({
      ...doc,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${doc.file_path}`,
    }));

    return NextResponse.json(images);
  } catch {
    return NextResponse.json(
      { error: "画像一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("units:edit");
    if (denied) return denied;

    const { id: unitId } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: unit } = await supabase
      .from("units")
      .select("property_id")
      .eq("id", unitId)
      .single();

    if (!unit) {
      return NextResponse.json({ error: "部屋が見つかりません" }, { status: 404 });
    }

    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("unit_id", unitId)
      .eq("document_type", "photo");

    if ((count ?? 0) >= MAX_IMAGES_PER_UNIT) {
      return NextResponse.json(
        { error: `画像は${MAX_IMAGES_PER_UNIT}枚までです` },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    const remaining = MAX_IMAGES_PER_UNIT - (count ?? 0);
    if (files.length > remaining) {
      return NextResponse.json(
        { error: `あと${remaining}枚までアップロードできます` },
        { status: 400 }
      );
    }

    const uploaded = [];
    const isFirstUpload = (count ?? 0) === 0;
    let firstFile = true;

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `${file.name}: JPEG、PNG、WebPのみ対応しています` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name}: 5MB以下のファイルのみアップロードできます` },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${companyId}/${unit.property_id}/units/${unitId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) {
        return NextResponse.json(
          { error: `${file.name}: アップロードに失敗しました` },
          { status: 500 }
        );
      }

      const setPrimary = isFirstUpload && firstFile;
      firstFile = false;

      const { data: doc, error: insertError } = await supabase
        .from("documents")
        .insert({
          company_id: companyId,
          property_id: unit.property_id,
          unit_id: unitId,
          document_type: "photo",
          file_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          is_primary: setPrimary,
        })
        .select("id, file_name, file_path, file_size, mime_type, is_primary, created_at")
        .single();

      if (insertError) {
        await supabase.storage.from("property-images").remove([storagePath]);
        return NextResponse.json(
          { error: "画像情報の保存に失敗しました" },
          { status: 500 }
        );
      }

      uploaded.push({
        ...doc,
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${storagePath}`,
      });
    }

    return NextResponse.json(uploaded, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("units:edit");
    if (denied) return denied;

    const { id: unitId } = await params;
    const supabase = await createClient();
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: "画像IDが必要です" }, { status: 400 });
    }

    const companyId = await getCompanyId();
    await supabase
      .from("documents")
      .update({ is_primary: false })
      .eq("unit_id", unitId)
      .eq("company_id", companyId)
      .eq("document_type", "photo");

    const { error } = await supabase
      .from("documents")
      .update({ is_primary: true })
      .eq("id", imageId)
      .eq("company_id", companyId);

    if (error) {
      return NextResponse.json({ error: "メイン画像の設定に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "メイン画像の設定に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("units:edit");
    if (denied) return denied;

    await params;
    const supabase = await createClient();
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: "画像IDが必要です" },
        { status: 400 }
      );
    }

    const companyId = await getCompanyId();
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, file_path")
      .eq("id", imageId)
      .eq("company_id", companyId)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json(
        { error: "画像が見つかりません" },
        { status: 404 }
      );
    }

    await supabase.storage.from("property-images").remove([doc.file_path]);

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", imageId)
      .eq("company_id", companyId);

    if (deleteError) {
      return NextResponse.json(
        { error: "画像の削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "削除に失敗しました" },
      { status: 500 }
    );
  }
}
