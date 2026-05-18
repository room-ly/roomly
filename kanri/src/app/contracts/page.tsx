import { getContracts, getUnitsForSelect, getTenantsForSelect, getCompany } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ContractsPageClient from "@/components/ContractsPageClient";
import ContractsTable from "@/components/ContractsTable";

export default async function ContractsPage() {
  const [contracts, units, tenants, company] = await Promise.all([
    getContracts(),
    getUnitsForSelect(),
    getTenantsForSelect(),
    getCompany(),
  ]);

  const alertDays = (company as any).contract_alert_days ?? 90;

  return (
    <>
      <PageHeader
        eyebrow="Contracts"
        title="契約"
        em={`${contracts.length}件`}
        description="入居者との賃貸借契約一覧。更新期限・退去申請をひと目で把握できます。"
        action={<ContractsPageClient units={units} tenants={tenants} />}
      />

      <ContractsTable data={contracts} alertDays={alertDays} />
    </>
  );
}
