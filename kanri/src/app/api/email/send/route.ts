import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { to, subject, html, from } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject, html は必須です" },
        { status: 400 }
      );
    }

    const data = await sendEmail({ to, subject, html, from });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 });
  }
}
