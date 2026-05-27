import { createClient, getCompanyId } from "@/lib/supabase-server";

interface NotifyParams {
  title: string;
  type?: "info" | "warning" | "danger";
  link?: string;
  body?: string;
  // 指定すると「この社員だけに見える」通知になる。未指定は会社全体共通。
  user_id?: string | null;
}

export async function createNotification(params: NotifyParams) {
  try {
    const supabase = await createClient();
    const company_id = await getCompanyId();
    await supabase.from("notifications").insert({
      company_id,
      user_id: params.user_id ?? null,
      title: params.title,
      type: params.type ?? "info",
      link: params.link ?? null,
      body: params.body ?? null,
    });
  } catch {
    // 通知生成の失敗で本体処理を巻き込まない
  }
}
