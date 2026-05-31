import crypto from "crypto";
import { createAdminClient } from "./supabase-admin";
import { sendEmail } from "./email";

// 配信停止トークン発行(既存があれば再利用)
async function getOrCreateUnsubscribeToken(
  email: string,
  category: "followup" | "all"
): Promise<string> {
  const supabase = createAdminClient();
  // email_unsubscribes は database.types.ts 未反映なので any キャストで回避
  // (型生成は別タスクでまとめて行う)
  const from = (supabase.from as unknown as (table: string) => any).bind(supabase);

  const { data: existing } = await from("email_unsubscribes")
    .select("token")
    .eq("email", email)
    .eq("category", category)
    .maybeSingle();

  if (existing?.token) return existing.token as string;

  const token = crypto.randomBytes(24).toString("base64url");
  const { error } = await from("email_unsubscribes")
    .insert({ email, category, token });

  if (error) throw new Error(`unsubscribe token 発行失敗: ${error.message}`);
  return token;
}

type FollowupParams = {
  email: string;
  name: string;
};

// 登録から7日経過 & 未操作のユーザーへのオンボーディング再喚起メール
export async function sendFollowupInactive7d({
  email,
  name,
}: FollowupParams): Promise<string> {
  const token = await getOrCreateUnsubscribeToken(email, "followup");
  const unsubscribeUrl = `https://hp.roomly.jp/email/unsubscribe?token=${token}`;

  const subject = "Roomly、その後いかがですか?";
  const displayName = name || "ご担当者";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.7; max-width: 600px; margin: 0 auto; padding: 24px;">

<p>${escapeHtml(displayName)} 様</p>

<p>Roomlyにご登録いただきありがとうございます。<br>
Roomly運営チームです。</p>

<p>登録から1週間が経ちましたが、まだ操作されていないようでしたので<br>
ご案内をお送りしています。</p>

<p>Roomlyは「物件を1件登録する」ところから始めると、<br>
家賃管理・契約管理・空室管理が一気に動き出します。<br>
所要時間は3分ほどです。</p>

<p>▼ ログイン<br>
<a href="https://kanri.roomly.jp/login" style="color: #2b6cb0;">https://kanri.roomly.jp/login</a></p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0;">

<p><strong>【先に運用イメージを確認したい方へ】</strong><br>
自社のデータを入れる前に動きを見たい場合は、<br>
サンプルデータが入ったデモ環境もご利用いただけます。</p>

<p>▼ デモ環境<br>
<a href="https://kanri.roomly.jp/login?demo=1" style="color: #2b6cb0;">https://kanri.roomly.jp/login?demo=1</a></p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0;">

<p><strong>【ぜひお聞かせください】</strong></p>
<ul>
<li>触ってみたけど、こういう機能があれば導入したかった</li>
<li>既存ツールから移行する際に、こういうデータ取り込みが必要</li>
<li>操作で詰まった、わかりにくかった</li>
</ul>

<p>など、率直なご意見をいただけると今後の改善に活かせます。<br>
このメールに直接ご返信いただければ運営チームに届きます。</p>

<p>今後ともよろしくお願いいたします。</p>

<p>Roomly運営チーム<br>
<a href="https://hp.roomly.jp" style="color: #2b6cb0;">https://hp.roomly.jp</a></p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 28px 0;">

<p style="font-size: 12px; color: #888;">
このメールはRoomly(<a href="https://kanri.roomly.jp" style="color: #888;">https://kanri.roomly.jp</a>)に<br>
ご登録いただいた方にお送りしています。<br><br>

今後この種のご案内メールが不要な場合は、以下から配信停止できます。<br>
<a href="${unsubscribeUrl}" style="color: #888;">配信停止</a>
</p>

</body>
</html>`;

  const result = await sendEmail({
    from: "Roomly運営チーム <contact@roomly.jp>",
    to: email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:contact@roomly.jp?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  return result?.id ?? "";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
