import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin-auth";

export default async function HomePage() {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/forbidden");
  }
  redirect("/affiliates");
}
