import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getTenantContract, getMoveOutRequests } from "@/lib/queries";
import MoveOutForm from "@/components/MoveOutForm";

export default async function MoveOutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [contract, existingRequests] = await Promise.all([
    getTenantContract(),
    getMoveOutRequests(),
  ]);

  const hasPending = existingRequests.some(
    (r: { status: string }) => r.status === "pending" || r.status === "approved"
  );

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center text-ink-3 text-sm">
          <p>有効な契約が見つかりません</p>
        </div>
      </div>
    );
  }

  if (hasPending) {
    redirect("/");
  }

  return <MoveOutForm contract={contract} />;
}
