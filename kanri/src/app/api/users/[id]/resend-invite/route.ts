import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getAppOrigin(request: NextRequest) {
  const fromEnv = process.env.NEXT_PUBLIC_KANRI_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const origin = request.headers.get("origin") || request.nextUrl.origin;
  return origin.replace(/\/$/, "");
}

function buildInviteEmailHtml({
  inviterName,
  companyName,
  inviteUrl,
}: {
  inviterName?: string | null;
  companyName?: string | null;
  inviteUrl: string;
}) {
  const inviter = inviterName ? `${inviterName} さん` : "管理者";
  const company = companyName ? `（${companyName}）` : "";
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a202c;line-height:1.7;">
  <h1 style="font-size:18px;font-weight:600;margin:0 0 24px;color:#1a365d;">Roomly へようこそ</h1>
  <p style="margin:0 0 16px;font-size:14px;">${inviter}${company}から Roomly への参加が招待されました。</p>
  <p style="margin:0 0 24px;font-size:14px;">下のボタンからパスワードを設定して、ログインしてください。</p>
  <p style="margin:0 0 32px;">
    <a href="${inviteUrl}" style="display:inline-block;background:#1a365d;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;">パスワードを設定する</a>
  </p>
  <p style="margin:0 0 8px;font-size:12px;color:#718096;">ボタンが押せない場合は、以下のURLをブラウザに貼り付けてください。</p>
  <p style="margin:0 0 32px;font-size:12px;color:#718096;word-break:break-all;">${inviteUrl}</p>
  <p style="margin:0;font-size:12px;color:#a0aec0;">このリンクの有効期限は24時間です。期限が切れた場合はログイン画面の「パスワードをお忘れですか？」から再発行できます。</p>
</div>
  `.trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data: currentRoleRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (currentRoleRow?.role !== "admin") {
      return NextResponse.json({ error: "管理者のみ実行できます" }, { status: 403 });
    }

    const companyId = await getCompanyId();
    const admin = getAdmin();

    const { data: target, error: fetchError } = await admin
      .from("users")
      .select("id, name, email, company_id, is_active")
      .eq("id", id)
      .single();

    if (fetchError || !target) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }
    if (target.company_id !== companyId) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }
    if (!target.is_active) {
      return NextResponse.json({ error: "削除済みのユーザーです" }, { status: 400 });
    }
    if (!target.email) {
      return NextResponse.json({ error: "メールアドレスが登録されていません" }, { status: 400 });
    }

    const appOrigin = getAppOrigin(request);
    const redirectTo = `${appOrigin}/update-password`;

    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email: target.email,
        options: { redirectTo },
      });

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json(
        { error: "招待リンクの生成に失敗しました" },
        { status: 500 }
      );
    }

    const { data: companyRow } = await admin
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    const { data: inviterRow } = await admin
      .from("users")
      .select("name")
      .eq("id", currentUser.id)
      .single();

    await sendEmail({
      to: target.email,
      subject: "Roomly パスワード設定のご案内（再送）",
      html: buildInviteEmailHtml({
        inviterName: inviterRow?.name,
        companyName: companyRow?.name,
        inviteUrl: linkData.properties.action_link,
      }),
    });

    return NextResponse.json({
      message: `${target.email} に招待メールを再送しました`,
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
