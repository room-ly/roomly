import type { SupabaseClient } from "@supabase/supabase-js";

// 経費の承認者を「物件指名 → 会社デフォルト」の優先順で解決する。
// どちらも未設定なら null。
export async function resolveExpenseApprover(
  supabase: SupabaseClient,
  args: { company_id: string; property_id: string | null | undefined },
): Promise<string | null> {
  if (args.property_id) {
    const { data: prop } = await supabase
      .from("properties")
      .select("approver_user_id")
      .eq("id", args.property_id)
      .eq("company_id", args.company_id)
      .single();
    if (prop?.approver_user_id) return prop.approver_user_id as string;
  }

  const { data: company } = await supabase
    .from("companies")
    .select("default_approver_user_id")
    .eq("id", args.company_id)
    .single();
  return (company?.default_approver_user_id as string | null) ?? null;
}
