import { getContracts, getUnitsForSelect, getTenantsForSelect, getCompany } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import ContractsPageClient from "@/components/ContractsPageClient";
import ContractsTable from "@/components/ContractsTable";
import ServerPagination from "@/components/ServerPagination";

const PAGE_SIZE = 50;

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const [{ data: contracts, total }, units, tenants, company] = await Promise.all([
    getContracts(page, PAGE_SIZE),
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
        em={`${total}件`}
        description="入居者との賃貸借契約一覧。更新期限・退去申請をひと目で把握できます。"
        action={<ContractsPageClient units={units} tenants={tenants} />}
      />

      <ContractsTable data={contracts} alertDays={alertDays} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
