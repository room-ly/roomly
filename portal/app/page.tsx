import { Suspense } from "react";
import { fetchVacancies } from "@/lib/queries";
import SearchForm from "./components/SearchForm";
import VacancyCard from "./components/VacancyCard";
import { Building2 } from "lucide-react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; layout?: string; rentMax?: string }>;
}) {
  const params = await searchParams;
  const vacancies = await fetchVacancies({
    area: params.area,
    layoutFilter: params.layout,
    rentMax: params.rentMax ? Number(params.rentMax) : undefined,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <section className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          おとり物件ゼロの賃貸検索
        </h1>
        <p className="text-gray-600">
          管理会社のデータベースから直接取得。すべてリアルタイムの空室情報です。
        </p>
      </section>

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-xl" />}>
        <SearchForm />
      </Suspense>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={20} className="text-accent" />
          <h2 className="font-bold text-lg">
            {vacancies.length > 0
              ? `${vacancies.length}件の空室`
              : "条件に合う空室はありません"}
          </h2>
        </div>
        {vacancies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies.map((v) => (
              <VacancyCard key={v.id} v={v} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={48} className="mx-auto mb-4" />
            <p>検索条件を変更してお探しください</p>
          </div>
        )}
      </section>
    </div>
  );
}
