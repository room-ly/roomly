import { getDocuments, getPropertiesForSelect, getAllTenantsForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import DocumentsPageClient from "@/components/DocumentsPageClient";

export default async function DocumentsPage() {
  const [documents, properties, tenants] = await Promise.all([
    getDocuments(),
    getPropertiesForSelect(),
    getAllTenantsForSelect(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Documents"
        title="書類"
        em="管理"
        description="契約書・写真・鍵預かり証など、物件に関わる書類を一元管理します。"
      />
      <DocumentsPageClient documents={documents} properties={properties} tenants={tenants} />
    </>
  );
}
