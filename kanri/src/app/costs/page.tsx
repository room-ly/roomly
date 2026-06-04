import { Suspense } from "react";
import {
  getExpenses,
  getExpenseFormOptions,
  getCompany,
} from "@/lib/queries";
import { createClient, getCompanyId, getCurrentUserRole } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import ExpensesPageClient from "@/components/ExpensesPageClient";
import ExpensesTable from "@/components/ExpensesTable";
import ServerPagination from "@/components/ServerPagination";
import SortSelect from "@/components/SortSelect";
import FeatureOffCard from "@/components/FeatureOffCard";
import ExpenseApprovalEnableForm from "@/components/ExpenseApprovalEnableForm";

const PAGE_SIZE = 50;
const SORT_OPTIONS = [
  { value: "expense_date:desc", label: "日付（新しい順）" },
  { value: "expense_date:asc", label: "日付（古い順）" },
  { value: "amount:desc", label: "金額（高い順）" },
  { value: "amount:asc", label: "金額（安い順）" },
];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { page: pageStr, sort } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const sortValue = sort || "expense_date:desc";
  const [{ data: expenses, total }, formOptions, company, me] = await Promise.all([
    getExpenses(page, PAGE_SIZE, sortValue),
    getExpenseFormOptions(),
    getCompany(),
    getCurrentUserRole(),
  ]);
  const { properties, owners, payees, cases: caseOptions, contracts: contractOptions } =
    formOptions;
  const approvalEnabled = company?.expense_approval_threshold != null;
  const canEditSettings = me?.role === "admin";

  // 稟議OFF時のみ承認者候補を取得（カード展開用）
  let approverCandidates: { id: string; name: string }[] = [];
  if (!approvalEnabled) {
    const supabase = await createClient();
    const companyId = await getCompanyId();
    const { data: candidateUsers } = await supabase
      .from("users")
      .select("user_id, name, role")
      .eq("company_id", companyId)
      .in("role", ["admin", "manager"])
      .order("name");
    approverCandidates = (candidateUsers ?? []).map((u: any) => ({
      id: u.user_id as string,
      name: (u.name as string) ?? "",
    }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Costs"
        title="費用"
        em="管理"
        description="物件で発生した費用・オーナー負担の管理。送金時にオーナー負担分が自動で控除されます。"
        action={
          <ExpensesPageClient
            properties={properties}
            owners={owners}
            payees={payees}
            cases={caseOptions}
            contracts={contractOptions}
          />
        }
      />

      {!approvalEnabled && (
        <FeatureOffCard
          title="稟議（費用承認フロー）"
          description="一定金額以上の費用を承認待ちにして、承認後に確定する運用ができます。"
          canEnable={canEditSettings}
          disabledReason="※ 管理者のみオンにできます"
        >
          <ExpenseApprovalEnableForm approverCandidates={approverCandidates} />
        </FeatureOffCard>
      )}

      <div className="flex justify-end mb-3">
        <Suspense>
          <SortSelect options={SORT_OPTIONS} defaultValue={sortValue} />
        </Suspense>
      </div>
      <ExpensesTable data={expenses} approvalEnabled={approvalEnabled} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
