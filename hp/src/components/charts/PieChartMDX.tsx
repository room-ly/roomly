"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ec4899", "#64748b",
  "#14b8a6", "#f97316", "#a855f7", "#6366f1",
];

type DataItem = { name: string; value: number };

interface PieChartMDXProps {
  data: DataItem[] | string;
  title?: string;
  unit?: string;
  height?: number | string;
  source?: string;
  donut?: boolean | string;
}

function parse<T>(v: T | string | undefined): T | undefined {
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return undefined; }
  }
  return v as T | undefined;
}

export function PieChartMDX({
  data: rawData,
  title,
  unit = "",
  height: rawHeight = 400,
  source,
  donut: rawDonut = false,
}: PieChartMDXProps) {
  const data = parse<DataItem[]>(rawData);
  const height = typeof rawHeight === "string" ? parseInt(rawHeight, 10) : rawHeight;
  const donut = typeof rawDonut === "string" ? rawDonut === "true" : rawDonut;

  if (!data || !Array.isArray(data)) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="not-prose my-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {title && (
        <h3 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={donut ? "40%" : 0}
            outerRadius="75%"
            dataKey="value"
            nameKey="name"
            label={({ name, value }) =>
              `${name} ${((value / total) * 100).toFixed(0)}%`
            }
            labelLine={{ strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              `${Number(value).toLocaleString()}${unit}`
            }
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {source && <p className="mt-3 text-xs text-slate-400">出典: {source}</p>}
    </div>
  );
}
