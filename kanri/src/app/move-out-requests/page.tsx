import { createClient } from "@/lib/supabase-server";
import MoveOutRequestsPageClient from "@/components/MoveOutRequestsPageClient";

export default async function MoveOutRequestsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("move_out_requests")
    .select(
      "*, tenant:tenants(name, phone, email), contract:contracts(id, unit:units(unit_number, property:properties(name)))"
    )
    .order("created_at", { ascending: false });

  return <MoveOutRequestsPageClient requests={data ?? []} />;
}
