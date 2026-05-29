import type { Metadata } from "next";
import { Suspense } from "react";
import AffiliateDashboardClient from "@/components/AffiliateDashboardClient";

export const metadata: Metadata = {
  title: "アフィリエイターダッシュボード",
  description: "Roomlyアフィリエイトプログラムのダッシュボードです。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/dashboard" },
};

export default function AffiliateDashboardPage() {
  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <Suspense
        fallback={
          <div className="mx-auto max-w-xl text-center text-[14px] text-rm-text-secondary">
            読み込み中...
          </div>
        }
      >
        <AffiliateDashboardClient />
      </Suspense>
    </section>
  );
}
