import { NextRequest, NextResponse } from "next/server";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const TENANT_APP_URL = process.env.TENANT_APP_URL || "http://localhost:3001";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requirePermission("tenants:edit");
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, email")
      .eq("id", id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "入居者が見つかりません" },
        { status: 404 }
      );
    }

    if (!tenant.email) {
      return NextResponse.json(
        { error: "入居者のメールアドレスが登録されていません" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("tenant_auth_users")
      .select("id")
      .eq("tenant_id", id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "この入居者は既に招待済みです" },
        { status: 409 }
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // inviteUserByEmail: ユーザー作成 + 招待メール送信を1回で実行
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(tenant.email, {
        data: { name: tenant.name, user_type: "tenant" },
        redirectTo: `${TENANT_APP_URL}/auth/confirm`,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // 既存authユーザーの場合、マッピングだけ作ってMagic Linkを送る
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.find((u) => u.email === tenant.email);
        if (existingUser) {
          await supabase.from("tenant_auth_users").insert({
            auth_user_id: existingUser.id,
            tenant_id: id,
            company_id: companyId,
          });

          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: tenant.email,
            options: { redirectTo: `${TENANT_APP_URL}/auth/confirm` },
          });

          return NextResponse.json({
            message: `${tenant.email} に招待メールを送信しました`,
          });
        }
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    await supabase.from("tenant_auth_users").insert({
      auth_user_id: authData.user.id,
      tenant_id: id,
      company_id: companyId,
    });

    return NextResponse.json({
      message: `${tenant.email} に招待メールを送信しました`,
    });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
