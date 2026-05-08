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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, is_active, created_at")
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
