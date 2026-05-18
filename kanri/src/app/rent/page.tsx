import { Suspense } from "react";
import { getRentBillings } from "@/lib/queries";
import PageHeader from "@/components/PageHeader";
import RentTable from "@/components/RentTable";
import { CsvImportButton } from "@/components/RentPageClient";

export default async function RentPage() {
  const billings = await getRentBillings();

  return (
    <>
      <PageHeader eyebrow="Rent" title="家賃" em="管理" description="家賃請求・入金状況の管理。滞納の追跡と入金確認を行います。" action={<CsvImportButton />} />
      <Suspense>
        <RentTable data={billings} />
      </Suspense>
    </>
  );
}
