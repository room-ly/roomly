import { getProperties, getOwners, getUsersForSelect } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import PropertiesPageClient from "@/components/PropertiesPageClient";
import PropertiesGrid from "@/components/PropertiesGrid";

export default async function PropertiesPage() {
  const [properties, owners, users] = await Promise.all([
    getProperties(),
    getOwners(),
    getUsersForSelect(),
  ]);

  const ownerOptions = owners.map((o: Record<string, any>) => ({
    id: o.id,
    name: o.name,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Properties"
        title="物件"
        em={`${properties.length}棟`}
        description="管理中の物件を一覧。物件カードから入居状況・収支・修繕履歴をまとめて確認できます。"
        action={<PropertiesPageClient owners={ownerOptions} users={users} />}
      />

      <PropertiesGrid properties={properties} owners={ownerOptions} users={users} />
    </>
  );
}
