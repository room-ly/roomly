import { getOwners } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import OwnersPageClient from "@/components/OwnersPageClient";
import OwnersTable from "@/components/OwnersTable";

export default async function OwnersPage() {
  const owners = await getOwners();

  const ownersWithInfo = owners.map((o: Record<string, any>) => {
    const ownerProps = o.properties || [];
    const ownerUnits = ownerProps.flatMap((p: any) => p.units || []);
    const occupiedUnits = ownerUnits.filter((u: any) => u.status === "occupied");

    return {
      ...o,
      propertyCount: ownerProps.length,
      unitCount: ownerUnits.length,
      occupiedCount: occupiedUnits.length,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Owners"
        title="オーナー"
        em="管理"
        description={`${owners.length}名のオーナー`}
        action={<OwnersPageClient />}
      />

      <OwnersTable owners={ownersWithInfo} />
    </>
  );
}
