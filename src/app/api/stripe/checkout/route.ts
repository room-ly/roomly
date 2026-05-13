import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { stripe, PLANS } from "@/lib/stripe";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();
    const plan = PLANS.find((p) => p.priceId === priceId);
    if (!plan) {
      return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
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
      .select("stripe_customer_id, name, email")
      .eq("id", companyId)
      .single();

    let customerId = company?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company?.email || user.email || undefined,
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=cancel`,
      metadata: { company_id: companyId },
      subscription_data: {
        metadata: { company_id: companyId, max_units: String(plan.maxUnits) },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました" },
      { status: 500 }
    );
  }
}
