import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import type Stripe from "stripe";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function updateCompanySubscription(
  subscription: Stripe.Subscription
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

  await admin
    .from("companies")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: periodEndIso,
      plan: subscription.status === "active" ? "pro" : "free",
      max_units: subscription.status === "active" ? maxUnits : 10,
    })
    .eq("id", companyId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // Webhook署名検証（STRIPE_WEBHOOK_SECRET が設定されていれば検証、なければスキップ）
  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      return NextResponse.json({ error: "署名検証失敗" }, { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await updateCompanySubscription(subscription);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateCompanySubscription(subscription);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subId = invoice.subscription;
      if (subId) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof subId === "string" ? subId : subId.id
        );
        await updateCompanySubscription(subscription);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
