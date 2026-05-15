import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getTenantContract } from "@/lib/queries";
import LostKeyForm from "@/components/LostKeyForm";

export default async function LostKeyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const contract = await getTenantContract();

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center text-ink-3 text-sm">
          <p>有効な契約が見つかりません</p>
        </div>
      </div>
    );
  }

  return <LostKeyForm contract={contract} />;
}
