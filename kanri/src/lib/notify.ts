import { createClient, getCompanyId } from "@/lib/supabase-server";

interface NotifyParams {
  title: string;
  type?: "info" | "warning" | "danger";
  link?: string;
  body?: string;
}

export async function createNotification(params: NotifyParams) {
  try {
    const supabase = await createClient();
    const company_id = await getCompanyId();
    await supabase.from("notifications").insert({
      company_id,
      title: params.title,
      type: params.type ?? "info",
      link: params.link ?? null,
      body: params.body ?? null,
    });
  } catch {
    // 通知生成の失敗で本体処理を巻き込まない
  }
}
