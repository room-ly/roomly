import { notFound } from "next/navigation";
import Link from "next/link";
import { getExpenseDetail, getPropertiesForSelect, getOwnersForSelect } from "@/lib/queries";
import StatusBadge from "@/components/StatusBadge";
import ExpenseDetailClient from "@/components/ExpenseDetailClient";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, properties, owners] = await Promise.all([
    getExpenseDetail(id),
    getPropertiesForSelect(),
    getOwnersForSelect(),
  ]);
  if (!expense) notFound();

  return (
    <>
      <div className="detail-back">
        <Link href="/expenses" className="rlink is-muted is-back">← 経費一覧に戻る</Link>
      </div>

      <div className="detail-header">
        <div className="detail-header-main">
          <div>
            <h1 className="detail-title">{expense.description}</h1>
            <div className="detail-kana">{expense.expense_date} — {expense.property?.name || "物件未指定"}</div>
          </div>
          <div style={{ marginLeft: 8, display: "flex", gap: 6, alignItems: "center" }}>
            <StatusBadge status={expense.category} />
            <span className={`charge-tag ${expense.is_owner_charge ? "warn" : "accent"}`}>
              <span className="dot" />
              {expense.is_owner_charge ? "オーナー負担" : "管理会社負担"}
            </span>
          </div>
        </div>
        <div className="detail-header-actions">
          <ExpenseDetailClient expense={expense} properties={properties} owners={owners} />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-col-main">
          {/* 金額 */}
          <div className="section">
            <div className="section-head-bar"><h2>金額</h2></div>
            <div className="section-body">
              <div className="cfee-grid">
                <div className="cfee-main">
                  <div className="cfee-label mono">経費金額</div>
                  <div className="cfee-value">¥{Number(expense.amount).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 詳細 */}
          <div className="section">
            <div className="section-head-bar"><h2>経費情報</h2></div>
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
                {expense.vendor_name && (
                  <div className="field">
                    <div className="field-label mono">業者</div>
                    <div className="field-value field-plain">{expense.vendor_name}</div>
                  </div>
                )}
                {expense.invoice_number && (
                  <div className="field">
                    <div className="field-label mono">請求書番号</div>
                    <div className="field-value field-plain mono">{expense.invoice_number}</div>
                  </div>
                )}
              </div>
              {expense.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <span className="field-label mono">備考</span>
                  <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{expense.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-col-side">
          {expense.property && (
            <div className="section">
              <div className="section-head-bar"><h2>物件</h2></div>
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
                  {expense.unit?.unit_number && (
                    <div className="field">
                      <div className="field-label mono">部屋</div>
                      <div className="field-value field-plain mono">{expense.unit.unit_number}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {expense.owner?.name && (
            <div className="section">
              <div className="section-head-bar"><h2>オーナー</h2></div>
              <div className="section-body">
                <div className="kv-list">
                  <div className="field">
                    <div className="field-label mono">氏名</div>
                    <div className="field-value field-plain">{expense.owner.name}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
