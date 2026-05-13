import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient, getCompanyId } from "@/lib/supabase-server";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
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
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "氏名・メール・パスワードは必須です" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    const companyId = await getCompanyId();
    const admin = getAdmin();

    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, company_id: companyId },
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました", details: authError.message },
        { status: 500 }
      );
    }

    const validRoles = ["admin", "manager", "staff", "viewer"];
    const userRole = validRoles.includes(role) ? role : "staff";

    const { error: profileError } = await admin.from("users").insert({
      id: authData.user.id,
      company_id: companyId,
      name,
      email,
      role: userRole,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "ユーザー作成に失敗しました", details: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: authData.user.id, name, email, role: userRole },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
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
        { error: "削除に失敗しました", details: updateError.message },
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
