import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 毎週月曜 JST 0:00（UTC 日曜 15:00）に cron で起動する Edge Function
// Supabase Dashboard > Edge Functions > Schedules で設定:
//   cron: "0 15 * * 0"  （UTC 日曜 15:00 = JST 月曜 0:00）

Deno.serve(async (req) => {
  // Supabase cron からの呼び出しのみ許可
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // デモ会社の一覧を取得
  const { data: demoCompanies, error: fetchError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("is_demo", true);

  if (fetchError) {
    console.error("デモ会社取得エラー:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  const results: { id: string; name: string; ok: boolean }[] = [];

  for (const company of demoCompanies ?? []) {
    const { error } = await supabase.rpc("reset_demo_data", {
      demo_company_id: company.id,
    });
    results.push({ id: company.id, name: company.name, ok: !error });
    if (error) console.error(`リセット失敗 ${company.name}:`, error);
  }

  console.log("デモリセット完了:", results);
  return new Response(JSON.stringify({ reset: results }), {
    headers: { "Content-Type": "application/json" },
  });
});
