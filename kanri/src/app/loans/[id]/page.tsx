import { notFound } from "next/navigation";
import { getLoanDetail, getCompany, getLoanCashflow } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import LoanDetailClient from "@/components/LoanDetailClient";
import AuditLogSection from "@/components/AuditLogSection";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany();
  if (company?.loan_feature_enabled !== true) notFound();

  const detail = await getLoanDetail(id);
  if (!detail) notFound();

  // 当月のキャッシュフロー（紐づく物件の家賃収入 − 当月返済）
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const cashflow = await getLoanCashflow(id, monthStart);

  return (
    <>
      <PageHeader
        eyebrow="Loan"
        title={detail.loan.name}
        em={detail.loan.lender_name}
        description="返済予定表（償還予定表）。借入条件から自動生成、CSV取込、手動編集ができます。"
      />
      <LoanDetailClient loan={detail.loan} repayments={detail.repayments} cashflow={cashflow} />
      <div style={{ marginTop: 24 }}>
        <AuditLogSection table="loans" recordId={detail.loan.id} recordLabel="ローン" />
      </div>
    </>
  );
}
