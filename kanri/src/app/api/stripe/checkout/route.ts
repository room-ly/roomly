import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient, getCompanyId, requirePermission } from "@/lib/supabase-server";
import { getStripe, PLANS, calcCustomPrice } from "@/lib/stripe";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requirePermission("settings:edit");
    if (denied) return denied;

    const body = await request.json();
    const { priceId, maxUnits: rawMaxUnits } = body;

    let checkoutPriceId: string;
    let maxUnits: number;

    if (priceId) {
      const plan = PLANS.find((p) => p.priceId === priceId);
      if (!plan) {
        return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
      }
      checkoutPriceId = priceId;
      maxUnits = plan.maxUnits;
    } else if (rawMaxUnits && Number(rawMaxUnits) > 2000) {
      maxUnits = Math.ceil(Number(rawMaxUnits) / 1000) * 1000;
      const amount = calcCustomPrice(maxUnits);
      if (!amount) {
        return NextResponse.json({ error: "無効な区画数です" }, { status: 400 });
      }
      const price = await getStripe().prices.create({
        product: (await getStripe().products.list({ limit: 1 })).data[0]?.id
          || (await getStripe().products.create({ name: "Roomly プラン" })).id,
        unit_amount: amount,
        currency: "jpy",
        recurring: { interval: "month" },
        metadata: { max_units: String(maxUnits) },
      });
      checkoutPriceId = price.id;
    } else {
      return NextResponse.json({ error: "priceId または maxUnits が必要です" }, { status: 400 });
    }

    const companyId = await getCompanyId();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const admin = getAdmin();
    const { data: company } = await admin
      .from("companies")
      .select("stripe_customer_id, name")
      .eq("id", companyId)
      .single();

    let customerId = company?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email || undefined,
        name: company?.name || undefined,
        metadata: { company_id: companyId },
      });
      customerId = customer.id;

      await admin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    const origin = request.headers.get("origin") || "http://localhost:3001";

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: checkoutPriceId, quantity: 1 }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=cancel`,
      metadata: { company_id: companyId },
      subscription_data: {
        metadata: { company_id: companyId, max_units: String(maxUnits) },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    const detail = err?.message || String(err);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました", detail },
      { status: 500 }
    );
  }
}
