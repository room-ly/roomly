import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const body = await request.json();
  const { vacancyId, name, email, phone, message } = body;

  if (!vacancyId || !name || !email || !message) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const { data: vacancy, error: vErr } = await supabaseAdmin
    .from("vacancies")
    .select("unit_id, unit:units!inner(property_id, company_id)")
    .eq("id", vacancyId)
    .single();

  if (vErr || !vacancy) {
    return NextResponse.json({ error: "物件情報が見つかりません" }, { status: 404 });
  }

  const unit = vacancy.unit as unknown as {
    property_id: string;
    company_id: string;
  };

  const { error: insertErr } = await supabaseAdmin.from("inquiries").insert({
    company_id: unit.company_id,
    property_id: unit.property_id,
    unit_id: vacancy.unit_id,
    inquiry_type: "general",
    title: `【ポータル】${name}様からのお問い合わせ`,
    description: `名前: ${name}\nメール: ${email}\n電話: ${phone || "未記入"}\n\n${message}`,
    status: "open",
    priority: "normal",
  });

  if (insertErr) {
    console.error("Inquiry insert error:", insertErr);
    return NextResponse.json({ error: "送信に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
