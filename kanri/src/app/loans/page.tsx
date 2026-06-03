import {
  getLoans,
  getLoanSummary,
  getCompany,
  getPropertiesForSelect,
  getOwnersForSelect,
} from "@/lib/queries";
import { getCurrentUserRole } from "@/lib/supabase-server";
import PageHeader from "@/components/PageHeader";
import FeatureOffCard from "@/components/FeatureOffCard";
import LoanFeatureEnableForm from "@/components/LoanFeatureEnableForm";
import LoansPageClient from "@/components/LoansPageClient";

export default async function LoansPage() {
  const company = await getCompany();
  const enabled = company?.loan_feature_enabled === true;
  const me = await getCurrentUserRole();
  const canEditSettings = me?.role === "admin";

  if (!enabled) {
    return (
      <>
        <PageHeader
          eyebrow="Loans"
          title="アパートローン"
          em="拡張機能"
          description="自社所有物件のローン返済を管理する拡張機能です。受託管理のみの会社では不要です。"
        />
        <FeatureOffCard
          title="アパートローン管理"
          description="返済予定表を取り込み、毎月の元金・利息・残高を管理。繰上返済・金利改定は手動編集できます。"
          canEnable={canEditSettings}
          disabledReason="管理者のみオンにできます"
        >
          <LoanFeatureEnableForm />
        </FeatureOffCard>
      </>
    );
  }

  const [loans, summary, properties, owners] = await Promise.all([
    getLoans(),
    getLoanSummary(),
    getPropertiesForSelect(),
    getOwnersForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Loans"
        title="アパートローン"
        em="返済管理"
        description="借入条件から返済予定表を生成、または銀行発行の償還予定表を取り込んで管理します。"
      />
      <LoansPageClient
        loans={loans}
        summary={summary}
        properties={properties}
        owners={owners}
      />
    </>
  );
}
