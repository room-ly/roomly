import { getInquiries, getPropertiesForSelect, getUnitsForSelect, getTenantsForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import InquiriesPageClient from "@/components/InquiriesPageClient";
import InquiriesTable from "@/components/InquiriesTable";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const [inquiries, properties, units, tenants] = await Promise.all([
    getInquiries(),
    getPropertiesForSelect(),
    getUnitsForSelect(),
    getTenantsForSelect(),
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
    </>
  );
}
