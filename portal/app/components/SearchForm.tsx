"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

const LAYOUT_OPTIONS = ["1R", "1K", "1DK", "1LDK", "2K", "2DK", "2LDK", "3LDK", "4LDK"];
const RENT_OPTIONS = [
  { label: "上限なし", value: "" },
  { label: "5万円以下", value: "50000" },
  { label: "7万円以下", value: "70000" },
  { label: "10万円以下", value: "100000" },
  { label: "15万円以下", value: "150000" },
  { label: "20万円以下", value: "200000" },
];

export default function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const area = form.get("area") as string;
    const layout = form.get("layout") as string;
    const rentMax = form.get("rentMax") as string;
    if (area) params.set("area", area);
    if (layout) params.set("layout", layout);
    if (rentMax) params.set("rentMax", rentMax);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            エリア・駅名
          </label>
          <input
            name="area"
            type="text"
            placeholder="例: 渋谷区、新宿駅"
            defaultValue={searchParams.get("area") ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            間取り
          </label>
          <select
            name="layout"
            defaultValue={searchParams.get("layout") ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
          >
            <option value="">すべて</option>
            {LAYOUT_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            家賃上限
          </label>
          <select
            name="rentMax"
            defaultValue={searchParams.get("rentMax") ?? ""}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none"
          >
            {RENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent/90 transition"
        >
          <Search size={18} />
          検索
        </button>
      </div>
    </form>
  );
}
