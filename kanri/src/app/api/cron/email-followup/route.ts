import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendFollowupInactive7d } from "@/lib/email-followup";

// Vercel Cron から日次で叩かれる。
// 登録から7日経過 & 全テーブルで過去7日間更新なし & is_demo=false & 未送信 のユーザーに
// オンボーディング再喚起メールを送る。同じユーザーには一度しか送らない(DB unique制約)。

export const dynamic = "force-dynamic";

const TEMPLATE = "inactive_7d";
const INACTIVE_DAYS = 7;

// company_id配下のいずれかのテーブルで activity_threshold 以降に updated_at があれば「アクティブ」
const ACTIVITY_TABLES = [
  "properties",
  "units",
  "tenants",
  "contracts",
  "rent_billings",
  "owners",
  "expenses",
  "owner_remittances",
] as const;

type Supabase = ReturnType<typeof createAdminClient>;

async function hasRecentActivity(
  supabase: Supabase,
  companyId: string,
  thresholdIso: string
): Promise<boolean> {
  for (const table of ACTIVITY_TABLES) {
    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("company_id", companyId)
      .gt("updated_at", thresholdIso)
      .limit(1);
    if (data && data.length > 0) return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    // email_unsubscribes / email_followup_logs は database.types.ts 未反映なので
    // 該当テーブルへのアクセスは any 経由(型生成は別タスクで一括対応)
    const fromUntyped = (
      supabase.from as unknown as (table: string) => any
    ).bind(supabase);
    const now = new Date();
    const inactiveThreshold = new Date(
      now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000
    );

    // 1. 7日以上前に登録された会社を取得(is_demo除外)
    const { data: companies, error: cErr } = await supabase
      .from("companies")
      .select("id, name, created_at, is_demo")
      .eq("is_demo", false)
      .lt("created_at", inactiveThreshold.toISOString());

    if (cErr) throw new Error(`会社抽出失敗: ${cErr.message}`);

    let sent = 0;
    let skippedAlreadySent = 0;
    let skippedActive = 0;
    let skippedUnsubscribed = 0;
    let skippedNoOwner = 0;
    const errors: string[] = [];

    for (const company of companies ?? []) {
      // 2. その会社の owner(最初に登録された admin/manager)を1人取得
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .in("role", ["admin", "manager"])
        .order("created_at", { ascending: true })
        .limit(1);

      const user = users?.[0];
      if (!user?.email) {
        skippedNoOwner++;
        continue;
      }

      // 3. 既に送信済みならスキップ(DB unique制約と二重防御)
      const { data: existing } = await fromUntyped("email_followup_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("template", TEMPLATE)
        .maybeSingle();
      if (existing) {
        skippedAlreadySent++;
        continue;
      }

      // 4. 配信停止中ならスキップ
      const { data: unsubs } = await fromUntyped("email_unsubscribes")
        .select("category")
        .eq("email", user.email)
        .in("category", ["followup", "all"])
        .not("unsubscribed_at", "is", null);
      if (unsubs && unsubs.length > 0) {
        skippedUnsubscribed++;
        continue;
      }

      // 5. 過去7日間に何らかのアクティビティがあればスキップ
      const active = await hasRecentActivity(
        supabase,
        company.id,
        inactiveThreshold.toISOString()
      );
      if (active) {
        skippedActive++;
        continue;
      }

      // 6. 送信
      try {
        const resendId = await sendFollowupInactive7d({
          email: user.email,
          name: user.name ?? "",
        });
        // 履歴記録(unique制約により重複INSERTは失敗 → 二度送信防止)
        await fromUntyped("email_followup_logs").insert({
          user_id: user.id,
          company_id: company.id,
          email: user.email,
          template: TEMPLATE,
          resend_id: resendId,
        });
        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${user.email}: ${msg}`);
      }
    }

    return NextResponse.json({
      ok: true,
      total: companies?.length ?? 0,
      sent,
      skippedAlreadySent,
      skippedActive,
      skippedUnsubscribed,
      skippedNoOwner,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "処理に失敗しました";
    console.error("email-followup cron エラー:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
