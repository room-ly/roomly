import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = [
  { priceId: process.env.STRIPE_PRICE_50!,   maxUnits: 50,   price: 5000,  label: "¥5,000（税込）/ 月" },
  { priceId: process.env.STRIPE_PRICE_100!,  maxUnits: 100,  price: 10000, label: "¥10,000（税込）/ 月" },
  { priceId: process.env.STRIPE_PRICE_300!,  maxUnits: 300,  price: 15000, label: "¥15,000（税込）/ 月" },
  { priceId: process.env.STRIPE_PRICE_500!,  maxUnits: 500,  price: 20000, label: "¥20,000（税込）/ 月" },
  { priceId: process.env.STRIPE_PRICE_1000!, maxUnits: 1000, price: 25000, label: "¥25,000（税込）/ 月" },
  { priceId: process.env.STRIPE_PRICE_2000!, maxUnits: 2000, price: 30000, label: "¥30,000（税込）/ 月" },
] as const;

export function getPlanByPriceId(priceId: string) {
  return PLANS.find((p) => p.priceId === priceId);
}
