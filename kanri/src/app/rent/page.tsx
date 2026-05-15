import { getRentBillings } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import RentTable from "@/components/RentTable";

export default async function RentPage() {
  const billings = await getRentBillings();

  return (
    <>
      <PageHeader title="家賃管理" description="家賃請求・入金状況" />
      <RentTable data={billings} />
    </>
  );
}
