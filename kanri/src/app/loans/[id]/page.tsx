import { notFound } from "next/navigation";
import { getLoanDetail, getCompany } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import LoanDetailClient from "@/components/LoanDetailClient";

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

  return (
    <>
      <PageHeader
        eyebrow="Loan"
        title={detail.loan.name}
        em={detail.loan.lender_name}
        description="返済予定表（償還予定表）。借入条件から自動生成、CSV取込、手動編集ができます。"
      />
      <LoanDetailClient loan={detail.loan} repayments={detail.repayments} />
    </>
  );
}
