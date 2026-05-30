import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getExpenseDetail,
  getPropertiesForSelect,
  getOwnersForSelect,
} from "@/lib/queries";
import { createClient, getCompanyId, getCurrentUserRole } from "@/lib/supabase-server";
import StatusBadge from "@/components/StatusBadge";
import ExpenseDetailClient from "@/components/ExpenseDetailClient";
import AuditLogSection from "@/components/AuditLogSection";
import DocumentSection from "@/components/DocumentSection";
import ExpenseApprovalPanel from "@/components/ExpenseApprovalPanel";
import OffFeaturesMenu from "@/components/OffFeaturesMenu";
import DepositBalancePanel from "@/components/DepositBalancePanel";
import {
  EXPENSE_STATUS_LABELS,
  TAX_CATEGORY_LABELS,
  type ExpenseStatus,
  type TaxCategory,
} from "@/lib/schemas-expense";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, properties, owners, me] = await Promise.all([
    getExpenseDetail(id),
    getPropertiesForSelect(),
    getOwnersForSelect(),
    getCurrentUserRole(),
  ]);
  if (!expense) notFound();

  // 稟議機能ON/OFF判定（threshold が NULL なら OFF）+ 承認者候補
  const supabase = await createClient();
  const companyId = await getCompanyId();
  const { data: company } = await supabase
    .from("companies")
    .select("expense_approval_threshold")
    .eq("id", companyId)
    .single();
  const approvalEnabled = company?.expense_approval_threshold != null;
  const { data: candidateUsers } = await supabase
    .from("users")
    .select("user_id, name, role")
    .eq("company_id", companyId)
    .in("role", ["admin", "manager"])
    .order("name");
  const approverCandidates = (candidateUsers ?? []).map((u: any) => ({
    id: u.user_id as string,
    name: (u.name as string) ?? "",
  }));
  const canEditSettings = me?.role === "admin";

  const approver = (expense.effective_approver ?? null) as { id: string; name: string } | null;
  const approverSource = (expense.approver_source ?? null) as "property" | "company" | null;
  const isApprover = !!approver && !!me && approver.id === me.user_id;
  const status = (expense.status as ExpenseStatus) || "draft";
  const taxCategory = (expense.tax_category as TaxCategory) || "taxable";
  const allocations = (expense.allocations ?? []) as any[];
  const depositTxs = (expense.deposit_transactions ?? []) as any[];

  return (
    <>
      <div className="detail-back">
        <Link href="/expenses" className="rlink is-muted is-back">
          ← 経費一覧に戻る
        </Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{expense.description}</h1>
            <div className="detail-kana">
              {expense.expense_date} —{" "}
              {expense.property?.id ? (
                <Link href={`/properties/${expense.property.id}`} className="rlink">
                  {expense.property.name}
                </Link>
              ) : (
                "物件未指定"
              )}
            </div>
          </div>
          <div style={{ marginLeft: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge status={expense.category} />
            {/* 稟議ONの会社、または paid 等の会計ステータスを持つ経費だけステータスバッジを表示 */}
            {(approvalEnabled || status === "paid") && (
              <span
                className={`charge-tag ${
                  status === "pending_approval"
                    ? "warn"
                    : status === "approved" || status === "paid"
                      ? "accent"
                      : status === "rejected"
                        ? "danger"
                        : ""
                }`}
              >
                {EXPENSE_STATUS_LABELS[status]}
              </span>
            )}
            {Number(expense.owner_amount) > 0 && (
              <span className="charge-tag warn">
                <span className="dot" />
                オーナー ¥{Number(expense.owner_amount).toLocaleString()}
              </span>
            )}
            {Number(expense.tenant_amount) > 0 && (
              <span className="charge-tag danger">
                <span className="dot" />
                入居者 ¥{Number(expense.tenant_amount).toLocaleString()}
              </span>
            )}
            {Number(expense.company_amount) > 0 && (
              <span className="charge-tag accent">
                <span className="dot" />
                自社 ¥{Number(expense.company_amount).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="detail-header-actions" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <OffFeaturesMenu
            approvalOff={!approvalEnabled}
            canEditSettings={canEditSettings}
            approverCandidates={approverCandidates}
          />
          <ExpenseDetailClient expense={expense} properties={properties} owners={owners} />
        </div>
      </div>

      {/* サマリーカード */}
      <div className="cols-summary" style={{ marginBottom: 24, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="sum-card">
          <span className="sum-label mono">金額</span>
          <span className="sum-value" style={{ fontSize: 16 }}>
            ¥{Number(expense.amount).toLocaleString()}
          </span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">カテゴリ</span>
          <span className="sum-value">
            <StatusBadge status={expense.category} />
          </span>
        </div>
        <div className="sum-card">
          <span className="sum-label mono">税区分</span>
          <span className="sum-value" style={{ fontSize: 14 }}>
            {TAX_CATEGORY_LABELS[taxCategory]}
          </span>
        </div>
      </div>

      {/* 稟議パネル（ON時のみ表示。OFF時のトグルは題名右の OffFeaturesMenu に集約） */}
      <ExpenseApprovalPanel
        expenseId={expense.id}
        status={status}
        isApprover={isApprover}
        approverName={approver?.name ?? null}
        approverSource={approverSource}
        approvalEnabled={approvalEnabled}
        canEditSettings={canEditSettings}
      />

      {status === "rejected" && expense.rejected_reason && (
        <div className="section">
          <div className="section-head-bar">
            <h2>却下理由</h2>
          </div>
          <div className="section-body">
            <p style={{ whiteSpace: "pre-wrap" }}>{expense.rejected_reason}</p>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 内訳 */}
          <div className="section">
            <div className="section-head-bar">
              <h2>内訳</h2>
            </div>
            <div className="section-body">
              <div className="cfee-grid">
                <div className="cfee-main">
                  <div className="cfee-label mono">経費金額</div>
                  <div className="cfee-value">¥{Number(expense.amount).toLocaleString()}</div>
                </div>
              </div>
              <table className="tbl" style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>区分</th>
                    <th style={{ textAlign: "right" }}>金額</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>オーナー負担</td>
                    <td className="num" style={{ color: "var(--warn)" }}>
                      ¥{Number(expense.owner_amount).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td>入居者負担</td>
                    <td className="num" style={{ color: "var(--danger)" }}>
                      ¥{Number(expense.tenant_amount).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td>自社負担</td>
                    <td className="num">¥{Number(expense.company_amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 按分明細 */}
          {allocations.length > 0 && (
            <div className="section">
              <div className="section-head-bar">
                <h2>按分明細</h2>
              </div>
              <div className="section-body">
                <table className="tbl" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>部屋</th>
                      <th style={{ textAlign: "right" }}>オーナー</th>
                      <th style={{ textAlign: "right" }}>入居者</th>
                      <th style={{ textAlign: "right" }}>自社</th>
                      <th style={{ textAlign: "right" }}>合計</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((a) => (
                      <tr key={a.id}>
                        <td>{a.unit?.unit_number ?? a.owner?.name ?? "—"}</td>
                        <td className="num">¥{Number(a.owner_amount).toLocaleString()}</td>
                        <td className="num">¥{Number(a.tenant_amount).toLocaleString()}</td>
                        <td className="num">¥{Number(a.company_amount).toLocaleString()}</td>
                        <td className="num strong">¥{Number(a.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 詳細 */}
          <div className="section">
            <div className="section-head-bar">
              <h2>経費情報</h2>
            </div>
            <div className="section-body">
              <div className="kv-grid">
                <div className="field">
                  <div className="field-label mono">日付</div>
                  <div className="field-value field-plain mono">{expense.expense_date}</div>
                </div>
                <div className="field">
                  <div className="field-label mono">内容</div>
                  <div className="field-value field-plain">{expense.description}</div>
                </div>
                {expense.payment_due_date && (
                  <div className="field">
                    <div className="field-label mono">支払期日</div>
                    <div className="field-value field-plain mono">{expense.payment_due_date}</div>
                  </div>
                )}
                {expense.paid_at && (
                  <div className="field">
                    <div className="field-label mono">支払日</div>
                    <div className="field-value field-plain mono">{expense.paid_at}</div>
                  </div>
                )}
                {expense.payee?.name && (
                  <div className="field">
                    <div className="field-label mono">支払先</div>
                    <div className="field-value field-plain">{expense.payee.name}</div>
                  </div>
                )}
                {expense.case && (
                  <div className="field">
                    <div className="field-label mono">紐付け対応案件</div>
                    <div className="field-value field-plain">
                      <Link href={`/cases/${expense.case.id}`} className="rlink">
                        {expense.case.title}
                      </Link>
                    </div>
                  </div>
                )}
                {expense.invoice_number && (
                  <div className="field">
                    <div className="field-label mono">請求書番号</div>
                    <div className="field-value field-plain mono">{expense.invoice_number}</div>
                  </div>
                )}
                {expense.approver && (
                  <div className="field">
                    <div className="field-label mono">承認者</div>
                    <div className="field-value field-plain">{expense.approver.name}</div>
                  </div>
                )}
                {expense.approved_at && (
                  <div className="field">
                    <div className="field-label mono">承認日時</div>
                    <div className="field-value field-plain mono">
                      {new Date(expense.approved_at).toLocaleString("ja-JP")}
                    </div>
                  </div>
                )}
              </div>
              {expense.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">備考</span>
                  <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>
                    {expense.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 敷金パネル */}
          {expense.contract?.id && (
            <DepositBalancePanel
              contractId={expense.contract.id}
              initialDeposit={Number(expense.contract.deposit || 0)}
              transactions={depositTxs}
              expenseId={expense.id}
              showAdditionalBilling
            />
          )}

          {expense.property?.id && (
            <DocumentSection propertyId={expense.property.id} title="関連書類（レシート等）" />
          )}
        </div>

        <div className="detail-col-side">
          {expense.property?.id && (
            <div className="section">
              <div className="section-head-bar">
                <h2>物件</h2>
              </div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">物件名</div>
                    <div className="field-value">
                      <Link href={`/properties/${expense.property.id}`} className="rlink">
                        {expense.property.name}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {expense.unit?.unit_number && (
            <div className="section">
              <div className="section-head-bar">
                <h2>部屋</h2>
              </div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">部屋番号</div>
                    <div className="field-value field-plain mono">
                      {expense.unit.unit_number}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {expense.owner?.name && (
            <div className="section">
              <div className="section-head-bar">
                <h2>オーナー</h2>
              </div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">氏名</div>
                    <div className="field-value">
                      {expense.owner.id ? (
                        <Link href={`/owners/${expense.owner.id}`} className="rlink">
                          {expense.owner.name}
                        </Link>
                      ) : (
                        expense.owner.name
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {expense.contract?.tenant && (
            <div className="section">
              <div className="section-head-bar">
                <h2>契約・入居者</h2>
              </div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">入居者</div>
                    <div className="field-value field-plain">
                      <Link href={`/tenants/${expense.contract.tenant.id}`} className="rlink">
                        {expense.contract.tenant.name}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AuditLogSection table="expenses" recordId={expense.id} recordLabel="経費" />
        </div>
      </div>
    </>
  );
}
