"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ec4899", "#64748b",
];

type LineItem = { dataKey: string; name: string; color?: string; dashed?: boolean };
type RefLineItem = { y: number; label: string; color?: string };

interface LineChartMDXProps {
  data: Record<string, unknown>[] | string;
  lines: LineItem[] | string;
  xAxisKey?: string;
  title?: string;
  unit?: string;
  height?: number | string;
  source?: string;
  refLines?: RefLineItem[] | string;
}

function parse<T>(v: T | string | undefined): T | undefined {
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return undefined; }
  }
  return v as T | undefined;
}

export function LineChartMDX({
  data: rawData,
  lines: rawLines,
  xAxisKey = "year",
  title,
  unit = "",
  height: rawHeight = 400,
  source,
  refLines: rawRefLines,
}: LineChartMDXProps) {
  const data = parse<Record<string, unknown>[]>(rawData);
  const lines = parse<LineItem[]>(rawLines);
  const refLines = parse<RefLineItem[]>(rawRefLines);
  const height = typeof rawHeight === "string" ? parseInt(rawHeight, 10) : rawHeight;

  if (!data || !Array.isArray(data) || !lines || !Array.isArray(lines)) return null;

  return (
    <div className="not-prose my-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {title && (
        <h3 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => `${Number(value).toLocaleString()}${unit}`}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend />
          {refLines?.map((ref, i) => (
            <ReferenceLine key={i} y={ref.y} label={ref.label} stroke={ref.color || "#94a3b8"} strokeDasharray="3 3" />
          ))}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {source && <p className="mt-3 text-xs text-slate-400">出典: {source}</p>}
    </div>
  );
}
