import { redirect } from "next/navigation";
import { createClient, getTenantId } from "@/lib/supabase-server";
import HomeClient from "@/components/HomeClient";
import { getTenantContract, getMoveOutRequests, getMaintenanceRequests, getCompanyName } from "@/lib/queries";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tenantId = await getTenantId();
  if (!tenantId) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  const [contract, moveOutRequests, maintenanceRequests, companyName] = await Promise.all([
    getTenantContract(),
    getMoveOutRequests(),
    getMaintenanceRequests(),
    getCompanyName(),
  ]);

  return (
    <HomeClient
      contract={contract}
      moveOutRequests={moveOutRequests}
      maintenanceRequests={maintenanceRequests}
      companyName={companyName}
    />
  );
}
