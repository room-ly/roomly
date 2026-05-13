import { NextResponse } from "next/server";
import { createClient, getCompanyId } from "@/lib/supabase-server";
import { PLANS } from "@/lib/stripe";

export async function GET() {
  try {
    const supabase = await createClient();
    const companyId = await getCompanyId();

    const [companyRes, unitsRes] = await Promise.all([
      supabase
        .from("companies")
        .select("plan, max_units, subscription_status, subscription_current_period_end, stripe_customer_id")
        .eq("id", companyId)
        .single(),
      supabase.from("units").select("id", { count: "exact", head: true }),
    ]);

    const company = companyRes.data;
    const plan = company?.plan ?? "free";
    const maxUnits = company?.max_units ?? 10;
    const currentUnits = unitsRes.count ?? 0;

    const isSubscriptionActive =
      company?.subscription_status === "active" &&
      (!company.subscription_current_period_end ||
        new Date(company.subscription_current_period_end) > new Date());

    const effectiveMax = isSubscriptionActive ? maxUnits : 10;

    const currentPlan = isSubscriptionActive
      ? PLANS.find((p) => p.maxUnits === maxUnits)
      : null;

    return NextResponse.json({
      plan,
      maxUnits: effectiveMax,
      currentUnits,
      isOver: currentUnits >= effectiveMax,
      subscriptionStatus: company?.subscription_status ?? "none",
      isSubscriptionActive,
      hasStripeCustomer: !!company?.stripe_customer_id,
      currentPlanName: currentPlan?.name ?? null,
      periodEnd: company?.subscription_current_period_end ?? null,
      plans: PLANS.map((p) => ({
        priceId: p.priceId,
        name: p.name,
        maxUnits: p.maxUnits,
        price: p.price,
        label: p.label,
      })),
    });
  } catch {
    return NextResponse.json(
      { plan: "free", maxUnits: 10, currentUnits: 0, isOver: false, subscriptionStatus: "none", isSubscriptionActive: false, hasStripeCustomer: false },
      { status: 200 }
    );
  }
}
