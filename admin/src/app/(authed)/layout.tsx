import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/admin-auth";
import AdminLayout from "@/components/AdminLayout";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdminUser();
  if (!user) {
    redirect("/forbidden");
  }
  return <AdminLayout email={user.email}>{children}</AdminLayout>;
}
