// Vercel cron が週次で叩くエンドポイント。
// デモ会社の業務データを全削除して、TS定義の seed-data から綺麗な初期状態に戻す。
// 認証: Vercel cron は Authorization: Bearer <CRON_SECRET> を付与してくる。
//
// SQL生成は generate-sql.ts、実行は Supabase Management API 経由（生SQLを1発で送れる）。

import { NextRequest, NextResponse } from "next/server";
import { generateResetSql } from "@/lib/demo-seed/generate-sql";
import { runManagementSql } from "@/lib/management-sql";
import { sendEmail, FROM_ADDRESSES } from "@/lib/email";

// 1分以内に終わる前提（Vercel hobby cronは10秒、proは60秒）
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // 認可: Vercel cron からの呼び出し（または手動トリガで Authorization 付与）のみ許可
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    return NextResponse.json({ error: "SUPABASE_ACCESS_TOKEN missing" }, { status: 500 });
  }

  // デモ会社一覧を取得（参照系なので actor ラップ不要）
  const listRes = await runManagementSql<{ id: string; name: string }>(
    "SELECT id, name FROM public.companies WHERE is_demo = TRUE;",
    { actorId: null },
  );
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to list demo companies", detail: listRes.error }, { status: 500 });
  }

  const results: Array<{ id: string; name: string; ok: boolean; error?: string }> = [];
  for (const c of listRes.data) {
    // generateResetSql が BEGIN/SET LOCAL request.headers/COMMIT を内包し、
    // 監査ログに SYSTEM_USER_ID を記録するため、ここでは二重ラップを避けて actorId: null。
    const sql = generateResetSql(c.id);
    const res = await runManagementSql(sql, { actorId: null });
    if (res.ok) {
      results.push({ id: c.id, name: c.name, ok: true });
    } else {
      results.push({ id: c.id, name: c.name, ok: false, error: res.error });
      console.error(`reset-demo failed for ${c.name}:`, res.error);
    }
  }

  const allOk = results.every((r) => r.ok);

  // 失敗時はサイレント化を防ぐためメール通知（環境変数で宛先未指定なら skip）
  if (!allOk && process.env.CRON_FAILURE_ALERT_EMAIL) {
    const failed = results.filter((r) => !r.ok);
    const summary = failed
      .map((r) => `- ${r.name} (${r.id}): ${r.error ?? "unknown"}`)
      .join("\n");
    try {
      await sendEmail({
        from: FROM_ADDRESSES.system,
        to: process.env.CRON_FAILURE_ALERT_EMAIL,
        subject: `[Roomly cron] reset-demo 失敗 (${failed.length}件)`,
        html: `<pre style="font-family:monospace;font-size:13px">reset-demo cron が失敗しました。\n\n失敗した会社:\n${summary}\n\nVercel ダッシュボードでログを確認してください。\nhttps://vercel.com/zh-ru-team/roomly-kanri/logs</pre>`,
      });
    } catch (e) {
      console.error("reset-demo: 通知メール送信失敗", e);
    }
  }

  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 });
}
