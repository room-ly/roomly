"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  selectedMonth: string;
  availableMonths: string[];
  onChange: (month: string) => void;
}

function formatMonth(ym: string) {
  return `${Number(ym.slice(0, 4))}年${Number(ym.slice(5, 7))}月`;
}

export default function MonthSelector({ selectedMonth, availableMonths, onChange }: MonthSelectorProps) {
  const currentIdx = selectedMonth === "all" ? -1 : availableMonths.indexOf(selectedMonth);

  function go(delta: number) {
    if (selectedMonth === "all") return;
    const newIdx = currentIdx - delta;
    if (newIdx >= 0 && newIdx < availableMonths.length) {
      onChange(availableMonths[newIdx]);
    }
  }

  const label = selectedMonth === "all" ? "全期間" : formatMonth(selectedMonth);

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(-1)}
          disabled={selectedMonth === "all" || currentIdx >= availableMonths.length - 1}
          className="p-1.5 rounded hover:bg-bg-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-lg font-semibold min-w-[8rem] text-center">{label}</span>
        <button
          onClick={() => go(1)}
          disabled={selectedMonth === "all" || currentIdx <= 0}
          className="p-1.5 rounded hover:bg-bg-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <select
        value={selectedMonth}
        onChange={(e) => onChange(e.target.value)}
        className="input text-[13px]"
        style={{ width: "10rem" }}
      >
        <option value="all">全期間</option>
        {availableMonths.map((m) => (
          <option key={m} value={m}>{formatMonth(m)}</option>
        ))}
      </select>
    </div>
  );
}
