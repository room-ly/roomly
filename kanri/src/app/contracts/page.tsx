import { Suspense } from "react";
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
        em="管理"
        description={`${contracts.length}件の契約`}
        action={<ContractsPageClient units={units} tenants={tenants} />}
      />

      <Suspense>
        <ContractsTable data={contracts} alertDays={alertDays} />
      </Suspense>
    </>
  );
}
