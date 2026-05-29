import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe, getPlanByPriceId } from "@/lib/stripe";
import type Stripe from "stripe";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function updateCompanySubscription(
  subscription: Stripe.Subscription,
  stripeEvent?: { id: string; type: string }
) {
  const admin = getAdmin();
  const companyId = subscription.metadata.company_id;
  if (!companyId) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? getPlanByPriceId(priceId) : null;
  const maxUnits = plan?.maxUnits ?? parseInt(subscription.metadata.max_units || "50");

  // current_period_end は v22 SDK ではトップレベルにない場合がある
  const periodEnd = (subscription as any).current_period_end;
  const periodEndIso = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : null;

  const newPlan = subscription.status === "active" ? "pro" : "free";

  // 遷移前の状態を取得（subscription_events 用 + subscription_started_at 設定判定用）
  const { data: prev } = await admin
    .from("companies")
    .select("subscription_status, subscription_started_at")
    .eq("id", companyId)
    .single();

  const fromStatus = prev?.subscription_status ?? null;

  const updatePayload: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_current_period_end: periodEndIso,
    plan: newPlan,
    max_units: subscription.status === "active" ? maxUnits : 10,
  };

  // 初めて有料化したタイミングを記録（既にあれば上書きしない）
  if (subscription.status === "active" && !prev?.subscription_started_at) {
    updatePayload.subscription_started_at = new Date().toISOString();
  }

  await admin.from("companies").update(updatePayload).eq("id", companyId);

  // ステータス変化があれば subscription_events に記録
  if (fromStatus !== subscription.status) {
    await admin.from("subscription_events").insert({
      company_id: companyId,
      event_type: stripeEvent?.type ?? "subscription.updated",
      from_status: fromStatus,
      to_status: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_event_id: stripeEvent?.id ?? null,
      plan: newPlan,
    });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "署名情報が不足しています" }, { status: 401 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "署名検証失敗" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        await updateCompanySubscription(subscription, { id: event.id, type: event.type });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateCompanySubscription(subscription, { id: event.id, type: event.type });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subId = invoice.subscription;
      if (subId) {
        const subscription = await getStripe().subscriptions.retrieve(
          typeof subId === "string" ? subId : subId.id
        );
        await updateCompanySubscription(subscription, { id: event.id, type: event.type });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
