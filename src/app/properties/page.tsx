import { getProperties, getOwners } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import PropertiesPageClient from "@/components/PropertiesPageClient";
import PropertyCard from "@/components/PropertyCard";

export default async function PropertiesPage() {
  const [properties, owners] = await Promise.all([
    getProperties(),
    getOwners(),
  ]);

  const ownerOptions = owners.map((o: Record<string, any>) => ({
    id: o.id,
    name: o.name,
  }));

  return (
    <>
      <PageHeader
        title="物件管理"
        description={`${properties.length}件の管理物件`}
        action={<PropertiesPageClient owners={ownerOptions} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {properties.map((prop: Record<string, any>) => (
          <PropertyCard key={prop.id} property={prop} owners={ownerOptions} />
        ))}
      </div>
    </>
  );
}
