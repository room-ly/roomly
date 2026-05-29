import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AffiliateDashboardClient from "@/components/AffiliateDashboardClient";
import { createAffiliateServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "アフィリエイターダッシュボード",
  description: "Roomlyアフィリエイトプログラムのダッシュボードです。",
  robots: { index: false, follow: false },
  alternates: { canonical: "/affiliate/dashboard" },
};

export default async function AffiliateDashboardPage() {
  const supabase = await createAffiliateServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/affiliate?tab=login");
  }

  return (
    <section className="px-7 pt-20 pb-24 sm:pt-28">
      <AffiliateDashboardClient />
    </section>
  );
}
