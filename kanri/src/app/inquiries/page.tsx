import { getInquiries, getPropertiesForSelect, getUnitsForSelect, getAllTenantsForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import InquiriesPageClient from "@/components/InquiriesPageClient";
import InquiriesTable from "@/components/InquiriesTable";
import ServerPagination from "@/components/ServerPagination";

const PAGE_SIZE = 50;

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { filter, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const [{ data: inquiries, total }, properties, units, tenants] = await Promise.all([
    getInquiries(page, PAGE_SIZE),
    getPropertiesForSelect(),
    getUnitsForSelect(),
    getAllTenantsForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Inquiries"
        title="問い合わせ"
        em="管理"
        description={`${inquiries.filter(q => q.status === "open").length}件未対応`}
        action={<InquiriesPageClient properties={properties} units={units} tenants={tenants} />}
      />

      <InquiriesTable inquiries={inquiries} initialFilter={filter} />
      <ServerPagination page={page} pageSize={PAGE_SIZE} total={total} />
    </>
  );
}
