import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

/**
 * メール送信
 * from のデフォルトは noreply@roomly.jp（システム自動送信用）
 */
export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: from ?? "Roomly <noreply@roomly.jp>",
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });

  if (error) {
    console.error("メール送信エラー:", error);
    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }

  return data;
}

/** 送信元アドレス一覧 */
export const FROM_ADDRESSES = {
  system: "Roomly <noreply@roomly.jp>",
  support: "Roomly サポート <support@roomly.jp>",
  billing: "Roomly 請求 <billing@roomly.jp>",
  contact: "Roomly <contact@roomly.jp>",
  info: "Roomly <info@roomly.jp>",
} as const;
