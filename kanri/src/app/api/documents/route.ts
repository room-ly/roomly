import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*, property:properties(name), tenant:tenants(name)")
      .order("created_at", { ascending: false });

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

    const documentType = (formData.get("document_type") as string) || "other";
    const propertyId = formData.get("property_id") as string | null;
    const tenantId = formData.get("tenant_id") as string | null;

    const ext = file.name.split(".").pop() || "";
    const storagePath = `documents/${companyId}/${randomUUID()}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(storagePath, buffer, {
        contentType: file.type,
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
  } catch {
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
