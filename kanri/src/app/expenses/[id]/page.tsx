import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <div className="mb-6">
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-accent mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          経費一覧に戻る
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">{expense.description}</h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              {expense.expense_date} — {expense.property?.name || "物件未指定"}
            </p>
          </div>
          <ExpenseDetailClient expense={expense} properties={properties} owners={owners} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* サマリーカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">金額</p>
              <p className="text-lg font-semibold tabular-nums">¥{Number(expense.amount).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">カテゴリ</p>
              <StatusBadge status={expense.category} />
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">負担区分</p>
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${expense.is_owner_charge ? "text-warn" : "text-accent"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${expense.is_owner_charge ? "bg-warn" : "bg-accent"}`} />
                {expense.is_owner_charge ? "オーナー負担" : "管理会社負担"}
              </span>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-1">日付</p>
              <p className="text-[14px] font-medium">{expense.expense_date}</p>
            </div>
          </div>

          {/* 詳細 */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold mb-4">経費詳細</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <div>
                <span className="text-ink-3">内容</span>
                <p className="font-medium">{expense.description}</p>
              </div>
              {expense.owner?.name && (
                <div>
                  <span className="text-ink-3">オーナー</span>
                  <p className="font-medium">{expense.owner.name}</p>
                </div>
              )}
              {expense.vendor_name && (
                <div>
                  <span className="text-ink-3">業者</span>
                  <p className="font-medium">{expense.vendor_name}</p>
                </div>
              )}
              {expense.invoice_number && (
                <div>
                  <span className="text-ink-3">請求書番号</span>
                  <p className="font-medium">{expense.invoice_number}</p>
                </div>
              )}
            </div>
            {expense.notes && (
              <div className="mt-4 pt-4 border-t border-line">
                <span className="text-[11px] text-ink-3">備考</span>
                <p className="text-[13px] mt-1 whitespace-pre-wrap">{expense.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {expense.property && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-4">物件情報</h2>
              <div className="space-y-3 text-[13px]">
                <div>
                  <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">物件</p>
                  <Link href={`/properties/${expense.property.id}`} className="text-accent hover:underline">
                    {expense.property.name}
                  </Link>
                </div>
                {expense.property.address && (
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">住所</p>
                    <p className="text-ink-2">{expense.property.address}</p>
                  </div>
                )}
                {expense.unit?.unit_number && (
                  <div>
                    <p className="text-[11px] text-ink-3 uppercase tracking-wider mb-0.5">部屋</p>
                    <p>{expense.unit.unit_number}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
