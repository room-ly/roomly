// 通知メールテンプレート

import { sendEmail, FROM_ADDRESSES } from "./email";

// 滞納通知メール
export async function sendOverdueNotification(params: {
  to: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  billingMonth: string;
  amount: number;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3436; font-size: 18px;">家賃滞納のお知らせ</h2>
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        以下の家賃請求が支払期限を超過しています。
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">入居者</td>
          <td style="padding: 8px; font-size: 13px;">${params.tenantName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">物件・部屋</td>
          <td style="padding: 8px; font-size: 13px;">${params.propertyName} ${params.unitNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">対象月</td>
          <td style="padding: 8px; font-size: 13px;">${params.billingMonth}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #999; font-size: 13px;">金額</td>
          <td style="padding: 8px; font-size: 13px; font-weight: bold; color: #c0392b;">
            &yen;${params.amount.toLocaleString()}
          </td>
        </tr>
      </table>
      <p style="color: #999; font-size: 12px;">
        このメールはRoomlyから自動送信されています。
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `【Roomly】家賃滞納のお知らせ - ${params.tenantName}様（${params.billingMonth}）`,
    html,
    from: FROM_ADDRESSES.billing,
  });
}

// 契約満了リマインダーメール
export async function sendContractExpiryReminder(params: {
  to: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  endDate: string;
  remainingDays: number;
}) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3436; font-size: 18px;">契約満了のリマインダー</h2>
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        以下の契約が ${params.remainingDays}日後に満了します。更新の手続きをご確認ください。
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">入居者</td>
          <td style="padding: 8px; font-size: 13px;">${params.tenantName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">物件・部屋</td>
          <td style="padding: 8px; font-size: 13px;">${params.propertyName} ${params.unitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #999; font-size: 13px;">満了日</td>
          <td style="padding: 8px; font-size: 13px; font-weight: bold; color: #c4873b;">
            ${params.endDate}（あと${params.remainingDays}日）
          </td>
        </tr>
      </table>
      <p style="color: #999; font-size: 12px;">
        このメールはRoomlyから自動送信されています。
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `【Roomly】契約満了のリマインダー - ${params.tenantName}様（${params.endDate}）`,
    html,
    from: FROM_ADDRESSES.system,
  });
}

// 修繕依頼通知メール
export async function sendMaintenanceNotification(params: {
  to: string;
  ownerName: string;
  propertyName: string;
  unitNumber: string;
  title: string;
  priority: string;
}) {
  const priorityLabel: Record<string, string> = {
    low: "低", normal: "通常", high: "高", urgent: "緊急",
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d3436; font-size: 18px;">修繕依頼のお知らせ</h2>
      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        ${params.ownerName}様、以下の修繕依頼が登録されました。
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">物件・部屋</td>
          <td style="padding: 8px; font-size: 13px;">${params.propertyName} ${params.unitNumber || ""}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; color: #999; font-size: 13px;">件名</td>
          <td style="padding: 8px; font-size: 13px; font-weight: bold;">${params.title}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: #999; font-size: 13px;">優先度</td>
          <td style="padding: 8px; font-size: 13px;">${priorityLabel[params.priority] ?? params.priority}</td>
        </tr>
      </table>
      <p style="color: #999; font-size: 12px;">
        このメールはRoomlyから自動送信されています。
      </p>
    </div>
  `;

  return sendEmail({
    to: params.to,
    subject: `【Roomly】修繕依頼 - ${params.propertyName} ${params.title}`,
    html,
    from: FROM_ADDRESSES.system,
  });
}
