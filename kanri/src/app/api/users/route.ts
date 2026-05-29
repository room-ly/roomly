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

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

async function getCurrentUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, is_active, created_at")
      .eq("is_active", true)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, role } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "氏名・メールアドレスは必須です" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const companyId = await getCompanyId();
    const admin = getAdmin();

    const validRoles = ["admin", "manager", "staff", "viewer"];
    const userRole = validRoles.includes(role) ? role : "staff";

    const appOrigin = getAppOrigin(request);
    const redirectTo = `${appOrigin}/auth/confirm?next=/update-password`;

    // generateLink({type: "invite"}) はAuthユーザーを作成しつつメール送信せずリンクだけ返す。
    // メール本文はResendから自前のテンプレートで送るので、これでメール2通問題を避ける。
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo, data: { name, company_id: companyId } },
      });

    if (linkError || !linkData?.properties?.action_link || !linkData.user?.id) {
      if (
        linkError?.message.includes("already been registered") ||
        linkError?.message.includes("already exists") ||
        linkError?.message.includes("already registered")
      ) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "招待リンクの生成に失敗しました" },
        { status: 500 }
      );
    }

    const authUserId = linkData.user.id;

    const { error: profileError } = await admin.from("users").insert({
      id: authUserId,
      company_id: companyId,
      name,
      email,
      role: userRole,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました" },
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

    try {
      await sendEmail({
        to: email,
        subject: "Roomly へのご招待",
        html: buildInviteEmailHtml({
          inviterName: inviterRow?.name,
          companyName: companyRow?.name,
          inviteUrl: linkData.properties.action_link,
        }),
      });
    } catch (e) {
      console.error("招待メール送信失敗:", e);
      return NextResponse.json(
        {
          error:
            "ユーザーは作成されましたが、招待メールの送信に失敗しました。ユーザー管理画面の封筒アイコンから招待を再送してください。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: authUserId, name, email, role: userRole },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, name, email, role } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "ユーザーIDが必要です" }, { status: 400 });
    }

    const currentRole = await getCurrentUserRole();
    if (currentRole !== "admin") {
      return NextResponse.json({ error: "管理者のみ編集できます" }, { status: 403 });
    }

    const companyId = await getCompanyId();
    const admin = getAdmin();

    const { data: targetUser, error: fetchError } = await admin
      .from("users")
      .select("id, company_id, is_active")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }
    if (targetUser.company_id !== companyId) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }
    if (!targetUser.is_active) {
      return NextResponse.json({ error: "削除済みのユーザーです" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) {
      const validRoles = ["admin", "manager", "staff", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "無効な権限です" }, { status: 400 });
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "変更内容がありません" }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "更新に失敗しました" },
        { status: 500 }
      );
    }

    if (email) {
      await admin.auth.admin.updateUserById(userId, { email });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "リクエストの処理に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "削除対象のユーザーIDが必要です" },
        { status: 400 }
      );
    }

    const currentUserId = await getCurrentUserId();
    const currentRole = await getCurrentUserRole();
    if (!currentUserId || !currentRole) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // 自分自身 or admin のみ削除可能
    if (userId !== currentUserId && currentRole !== "admin") {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    const companyId = await getCompanyId();
    const admin = getAdmin();

    // 対象ユーザーが同じ会社に属しているか確認
    const { data: targetUser, error: fetchError } = await admin
      .from("users")
      .select("id, role, is_active, company_id")
      .eq("id", userId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (targetUser.company_id !== companyId) {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    if (!targetUser.is_active) {
      return NextResponse.json(
        { error: "このユーザーは既に削除されています" },
        { status: 400 }
      );
    }

    // 会社の最後のadminは削除不可
    if (targetUser.role === "admin") {
      const { count } = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("role", "admin")
        .eq("is_active", true);

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "最後の管理者は削除できません" },
          { status: 400 }
        );
      }
    }

    // 論理削除: is_active=false, deleted_at を設定
    const { error: updateError } = await admin
      .from("users")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "削除に失敗しました" },
        { status: 500 }
      );
    }

    // Supabase Auth ユーザーを ban（ログイン不可にする）
    await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
