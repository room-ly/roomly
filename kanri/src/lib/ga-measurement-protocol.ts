// GA4 Measurement Protocol でサーバーサイドからイベントを送る。
// Stripe webhookで有料転換が確定したタイミングで purchase を送信し、
// Google広告のSmart Biddingに「課金転換」を学習させる。

// 必要env:
//   GA_MEASUREMENT_ID      — 例: G-Y2943F8G2J（kanriのフロントと同じ）
//   GA_API_SECRET          — GA4 管理画面 > データストリーム > Measurement Protocol API シークレット

type PurchasePayload = {
  clientId: string;
  transactionId: string;
  valueJpy: number;
  planLabel?: string;
  maxUnits?: number;
  gclid?: string | null;
};

const ENDPOINT = "https://www.google-analytics.com/mp/collect";

export async function sendGa4Purchase(payload: PurchasePayload): Promise<void> {
  const measurementId =
    process.env.GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GA_ID ||
    "G-Y2943F8G2J";
  const apiSecret = process.env.GA_API_SECRET;

  // シークレット未設定なら何もしない（開発環境やシークレット未登録時に落とさない）
  if (!apiSecret || !payload.clientId) return;

  const body = {
    client_id: payload.clientId,
    // gclid があればイベント単位で添付（Google広告のオフラインCV連携に使われる）
    ...(payload.gclid ? { user_properties: { gclid: { value: payload.gclid } } } : {}),
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: payload.transactionId,
          value: payload.valueJpy,
          currency: "JPY",
          items: [
            {
              item_id: payload.planLabel || "roomly_pro",
              item_name: payload.planLabel || "Roomly Pro",
              item_category: "saas_subscription",
              quantity: 1,
              price: payload.valueJpy,
            },
          ],
          ...(payload.maxUnits ? { max_units: payload.maxUnits } : {}),
        },
      },
    ],
  };

  try {
    const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Vercel Functions のレスポンスを止めないためにタイムアウト的に投げっぱなしにする
    });
  } catch (e) {
    // 送信失敗は本処理を止めない
    console.error("GA4 Measurement Protocol送信失敗:", e);
  }
}
