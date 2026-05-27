import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const propertyId = request.nextUrl.searchParams.get("property_id");
    const tenantId = request.nextUrl.searchParams.get("tenant_id");

    let query = supabase
      .from("documents")
      .select("*, property:properties(name), tenant:tenants(name)")
      .order("created_at", { ascending: false });

    if (propertyId) query = query.eq("property_id", propertyId);
    if (tenantId) query = query.eq("tenant_id", tenantId);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const companyId = await getCompanyId();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    const VALID_DOC_TYPES = ["contract", "photo", "key_receipt", "inspection", "other"];
    const rawDocType = formData.get("document_type") as string;
    const documentType = VALID_DOC_TYPES.includes(rawDocType) ? rawDocType : "other";

    const ALLOWED_MIME: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };
    const normalizedMime = file.type.split(";")[0].trim();
    if (!ALLOWED_MIME[normalizedMime]) {
      return NextResponse.json({ error: "PDF・画像ファイルのみアップロード可能です" }, { status: 400 });
    }

    const propertyId = formData.get("property_id") as string | null;
    const tenantId = formData.get("tenant_id") as string | null;

    const ext = ALLOWED_MIME[normalizedMime];
    const storagePath = `${companyId}/documents/${randomUUID()}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(storagePath, buffer, {
        contentType: normalizedMime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `アップロード失敗: ${uploadError.message}` }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("documents").insert({
      company_id: companyId,
      file_name: file.name,
      file_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      document_type: documentType,
      property_id: propertyId || null,
      tenant_id: tenantId || null,
    });

    if (insertError) {
      await supabase.storage.from("property-images").remove([storagePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "アップロード中にエラーが発生しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json({ error: "書類が見つかりません" }, { status: 404 });
    }

    if (doc.file_path) {
      await supabase.storage.from("property-images").remove([doc.file_path]);
    }

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
