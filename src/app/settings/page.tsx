import { getCompany, getUsers } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const [company, users] = await Promise.all([getCompany(), getUsers()]);

  return (
    <>
      <PageHeader title="設定" description="アカウント・利用設定" />
      <SettingsClient company={company} users={users} />
    </>
  );
}
