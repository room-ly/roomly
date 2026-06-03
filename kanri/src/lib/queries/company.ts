import { createClient, type Row } from "./_shared";
import { isOverdue } from "@/lib/billing-status";

// 会社情報
export async function getCompany() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .single();
  if (error) throw error;
  return data as Row;
}

// バッジカウント + 会社設定（Sidebar用API）
export async function getBadgeCounts() {
  const supabase = await createClient();

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 3);
  const staleDate = staleThreshold.toISOString();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [overdueRes, casesUrgentRes, casesStaleRes, companyRes, authRes] =
    await Promise.all([
      supabase
        .from("rent_billings")
        .select("id, total_amount, due_date, rent_payments(amount)")
        .lt("due_date", todayStr),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["high", "urgent"]),
      supabase
        .from("cases")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])
        .in("priority", ["low", "normal"])
        .lt("created_at", staleDate),
      supabase.from("companies").select("name, contract_alert_days, is_demo, loan_feature_enabled").single(),
      supabase.auth.getUser(),
    ]);

  const alertDays = (companyRes.data?.contract_alert_days as number) ?? 90;
  const alertDate = new Date();
  alertDate.setDate(alertDate.getDate() + alertDays);
  const today = new Date().toISOString().slice(0, 10);
  const alertDateStr = alertDate.toISOString().slice(0, 10);

  // 「更新間近」= 満了がアラート期間内の有効契約。ただし退去予告（pending/approved）が
  // 出ている契約はもう更新しないので除外する（契約一覧の「更新間近」タブと定義を揃える）。
  const contractsPromise = supabase
    .from("contracts")
    .select("id, move_out_requests(status)")
    .eq("status", "active")
    .gte("end_date", today)
    .lte("end_date", alertDateStr);

  const profilePromise = authRes.data?.user
    ? supabase.from("users").select("name, email").eq("id", authRes.data.user.id).single()
    : Promise.resolve({ data: null });

  const [contractsRes, profileRes] = await Promise.all([contractsPromise, profilePromise]);

  const userEmail = profileRes.data?.email ?? authRes.data?.user?.email ?? "";
  const userName = profileRes.data?.name ?? "";

  const rent = ((overdueRes.data ?? []) as Row[]).filter((b) => isOverdue(b as any, todayStr)).length;
  const cases = (casesUrgentRes.count ?? 0) + (casesStaleRes.count ?? 0);
  const contracts = ((contractsRes.data ?? []) as Row[]).filter((c: Row) => {
    const reqs = (c.move_out_requests ?? []) as Row[];
    return !reqs.some((r: Row) => r.status === "pending" || r.status === "approved");
  }).length;
  const dashboard = rent + cases + contracts;

  return {
    "/": dashboard,
    "/rent": rent,
    "/cases": cases,
    "/contracts": contracts,
    company_name: (companyRes.data?.name as string) ?? "",
    contract_alert_days: alertDays,
    user_name: userName,
    user_email: userEmail,
    is_demo: (companyRes.data?.is_demo as boolean) ?? false,
    loan_feature_enabled: (companyRes.data?.loan_feature_enabled as boolean) ?? false,
  };
}
