import { getContracts, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ContractsPageClient from "@/components/ContractsPageClient";
import ContractsTable from "@/components/ContractsTable";

export default async function ContractsPage() {
  const [contracts, units, tenants] = await Promise.all([
    getContracts(),
    getUnitsForSelect(),
    getTenantsForSelect(),
  ]);

  return (
    <>
      <PageHeader
        title="契約管理"
        description={`${contracts.length}件の契約`}
        action={<ContractsPageClient units={units} tenants={tenants} />}
      />

      <ContractsTable data={contracts} units={units} tenants={tenants} />
    </>
  );
}
