import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getTenantContract, getMaintenanceRequests } from "@/lib/queries";
import MaintenanceClient from "@/components/MaintenanceClient";

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [contract, requests] = await Promise.all([
    getTenantContract(),
    getMaintenanceRequests(),
  ]);

  return <MaintenanceClient contract={contract} requests={requests} />;
}
