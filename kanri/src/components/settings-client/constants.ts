export const roleLabels: Record<string, string> = {
  admin: "管理者",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧のみ",
};

export interface PlanOption {
  priceId: string;
  maxUnits: number;
  price: number;
  label: string;
}

export interface PlanInfo {
  currentUnits: number;
  maxUnits: number;
  isSubscriptionActive: boolean;
  periodEnd: string | null;
  hasStripeCustomer: boolean;
}
