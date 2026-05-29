import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import {
  getRequestMeta,
  normalizeAttribution,
  truncate,
} from "@/lib/request-meta";

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
  const admin = getAdminClient();
  const meta = getRequestMeta(request);

  let companyName: string | undefined;
  let name: string | undefined;
  let email: string | undefined;
  let password: string | undefined;
  let attribution: ReturnType<typeof normalizeAttribution> = {};

  try {
    const body = await request.json();
    companyName = body.companyName;
    name = body.name;
    email = body.email;
    password = body.password;
    attribution = normalizeAttribution(body.attribution);
  } catch {
    await recordAttempt(admin, {
      success: false,
      error_code: "invalid_json",
      meta,
      attribution: {},
    });
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 400 }
    );
  }

  const emailLower = email ? email.toLowerCase() : undefined;

  const baseAttempt = {
    email: emailLower ?? null,
    company_name: truncate(companyName),
    name: truncate(name),
    meta,
    attribution,
  };

  if (!companyName || !name || !email || !password) {
    await recordAttempt(admin, {
      ...baseAttempt,
      success: false,
      error_code: "validation",
      error_message: "必須項目が不足",
    });
    return NextResponse.json(
      { error: "全ての項目を入力してください" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    await recordAttempt(admin, {
      ...baseAttempt,
      success: false,
      error_code: "validation",
      error_message: "パスワードが短い",
    });
    return NextResponse.json(
      { error: "パスワードは8文字以上で入力してください" },
      { status: 400 }
    );
  }

  try {
    // 1. 会社を作成（広告流入情報を保存）
    const companyInsert: Record<string, unknown> = {
      name: companyName,
      utm_source: attribution.utm_source ?? null,
      utm_medium: attribution.utm_medium ?? null,
      utm_campaign: attribution.utm_campaign ?? null,
      utm_term: attribution.utm_term ?? null,
      utm_content: attribution.utm_content ?? null,
      referrer: attribution.referrer ?? null,
      landing_path: attribution.landing_path ?? null,
      signup_gclid: attribution.gclid ?? null,
      ga_client_id: attribution.ga_client_id ?? null,
    };

    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert(companyInsert)
      .select()
      .single();

    if (companyError) {
      console.error("会社作成エラー:", companyError);
      await recordAttempt(admin, {
        ...baseAttempt,
        success: false,
        error_code: "company_insert_error",
        error_message: companyError.message,
      });
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

      const duplicate = authError.message.includes("already been registered");
      await recordAttempt(admin, {
        ...baseAttempt,
        success: false,
        error_code: duplicate ? "duplicate_email" : "auth_error",
        error_message: authError.message,
      });

      if (duplicate) {
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
      await recordAttempt(admin, {
        ...baseAttempt,
        success: false,
        error_code: "profile_error",
        error_message: profileError.message,
      });
      return NextResponse.json(
        { error: "アカウント作成に失敗しました" },
        { status: 500 }
      );
    }

    await recordAttempt(admin, {
      ...baseAttempt,
      success: true,
      created_company_id: company.id,
    });

    // 4. サーバー側でログインしてセッションCookieをレスポンスに含める
    const response = NextResponse.json(
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
  } catch (e) {
    console.error("signupエラー:", e);
    await recordAttempt(admin, {
      ...baseAttempt,
      success: false,
      error_code: "unknown_error",
      error_message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}

type RecordAttemptArgs = {
  email?: string | null;
  company_name?: string | null;
  name?: string | null;
  success: boolean;
  error_code?: string;
  error_message?: string;
  created_company_id?: string;
  meta: ReturnType<typeof getRequestMeta>;
  attribution: ReturnType<typeof normalizeAttribution>;
};

async function recordAttempt(
  admin: ReturnType<typeof getAdminClient>,
  args: RecordAttemptArgs
) {
  try {
    await admin.from("signup_attempts").insert({
      email: args.email ?? null,
      company_name: args.company_name ?? null,
      name: args.name ?? null,
      success: args.success,
      error_code: args.error_code ?? null,
      error_message: args.error_message ?? null,
      created_company_id: args.created_company_id ?? null,
      ip_address: args.meta.ip_address,
      country: args.meta.country,
      region: args.meta.region,
      city: args.meta.city,
      user_agent: args.meta.user_agent,
      referrer: args.attribution.referrer ?? null,
      landing_path: args.attribution.landing_path ?? null,
      utm_source: args.attribution.utm_source ?? null,
      utm_medium: args.attribution.utm_medium ?? null,
      utm_campaign: args.attribution.utm_campaign ?? null,
      utm_term: args.attribution.utm_term ?? null,
      utm_content: args.attribution.utm_content ?? null,
      gclid: args.attribution.gclid ?? null,
      ga_client_id: args.attribution.ga_client_id ?? null,
    });
  } catch (e) {
    // 計測失敗は本処理を止めない
    console.error("signup_attempts記録失敗:", e);
  }
}
