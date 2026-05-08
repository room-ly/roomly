import { getInquiries } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import InquiriesPageClient from "@/components/InquiriesPageClient";
import InquiriesTable from "@/components/InquiriesTable";

export default async function InquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <>
      <PageHeader
        title="問い合わせ管理"
        description={`${inquiries.length}件の問い合わせ`}
        action={<InquiriesPageClient />}
      />

      <InquiriesTable inquiries={inquiries} />
    </>
  );
}
