import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = [
  {
    priceId: process.env.STRIPE_PRICE_50!,
    name: "スタンダード",
    maxUnits: 50,
    price: 5000,
    label: "¥5,000（税込）/ 月",
  },
  {
    priceId: process.env.STRIPE_PRICE_200!,
    name: "ビジネス",
    maxUnits: 200,
    price: 10000,
    label: "¥10,000（税込）/ 月",
  },
  {
    priceId: process.env.STRIPE_PRICE_2000!,
    name: "エンタープライズ",
    maxUnits: 2000,
    price: 30000,
    label: "¥30,000（税込）/ 月",
  },
] as const;

export function getPlanByPriceId(priceId: string) {
  return PLANS.find((p) => p.priceId === priceId);
}
