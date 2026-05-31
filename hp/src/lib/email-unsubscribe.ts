import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.ROOMLY_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.ROOMLY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 環境変数が設定されていません");
  return createClient(url, key);
}

export type UnsubscribeCategory = "followup" | "all";

// 配信停止用トークンを発行(同じemail+categoryで既存があれば再利用)
export async function getOrCreateUnsubscribeToken(
  email: string,
  category: UnsubscribeCategory
): Promise<string> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("email_unsubscribes")
    .select("token")
    .eq("email", email)
    .eq("category", category)
    .maybeSingle();

  if (existing?.token) return existing.token;

  const token = crypto.randomBytes(24).toString("base64url");
  const { error } = await supabase
    .from("email_unsubscribes")
    .insert({ email, category, token });

  if (error) throw new Error(`unsubscribe token 発行失敗: ${error.message}`);
  return token;
}

// トークン経由で配信停止を実行
export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; email?: string; category?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .update({ unsubscribed_at: new Date().toISOString(), resubscribed_at: null })
    .eq("token", token)
    .select("email, category")
    .maybeSingle();

  if (error || !data) return { ok: false };
  return { ok: true, email: data.email, category: data.category };
}

// 配信停止を取り消す(誤クリック対策)
export async function resubscribeByToken(
  token: string
): Promise<{ ok: boolean; email?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("email_unsubscribes")
    .update({ resubscribed_at: new Date().toISOString(), unsubscribed_at: null })
    .eq("token", token)
    .select("email")
    .maybeSingle();

  if (error || !data) return { ok: false };
  return { ok: true, email: data.email };
}

// 配信停止中かチェック(送信前に呼ぶ)
export async function isUnsubscribed(
  email: string,
  category: UnsubscribeCategory
): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("unsubscribed_at, category")
    .eq("email", email)
    .in("category", [category, "all"])
    .not("unsubscribed_at", "is", null);

  return !!data && data.length > 0;
}

export function buildUnsubscribeUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_HP_URL || "https://hp.roomly.jp";
  return `${base}/email/unsubscribe?token=${token}`;
}
