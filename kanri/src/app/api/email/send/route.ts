import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject, html は必須です" },
        { status: 400 }
      );
    }

    const data = await sendEmail({ to, subject, html, from });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "メール送信に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
