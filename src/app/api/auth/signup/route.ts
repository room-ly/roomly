import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase環境変数が設定されていません");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { companyName, name, email, password } = await request.json();

    if (!companyName || !name || !email || !password) {
      return NextResponse.json(
        { error: "全ての項目を入力してください" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "パスワードは8文字以上で入力してください" },
        { status: 400 }
      );
    }

    const admin = getAdminClient();

    // 1. 会社を作成
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({ name: companyName })
      .select()
      .single();

    if (companyError) {
      console.error("会社作成エラー:", companyError);
      return NextResponse.json(
        { error: "アカウント作成に失敗しました" },
        { status: 500 }
      );
    }

    // 2. Auth ユーザーを作成
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, company_id: company.id },
      });

    if (authError) {
      await admin.from("companies").delete().eq("id", company.id);

      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています" },
          { status: 409 }
        );
      }

      console.error("Auth作成エラー:", authError);
      return NextResponse.json(
        { error: "アカウント作成に失敗しました" },
        { status: 500 }
      );
    }

    // 3. public.users にプロフィールを作成
    const { error: profileError } = await admin.from("users").insert({
      id: authData.user.id,
      company_id: company.id,
      name,
      email,
      role: "admin",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      await admin.from("companies").delete().eq("id", company.id);

      console.error("プロフィール作成エラー:", profileError);
      return NextResponse.json(
        { error: "アカウント作成に失敗しました" },
        { status: 500 }
      );
    }

    // 4. サーバー側でログインしてセッションCookieをレスポンスに含める
    let response = NextResponse.json(
      { message: "アカウントを作成しました", requiresEmailConfirmation: false },
      { status: 201 }
    );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name: cookieName, value, options }) => {
              response.cookies.set(cookieName, value, options);
            });
          },
        },
      }
    );

    await supabase.auth.signInWithPassword({ email, password });

    return response;
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
