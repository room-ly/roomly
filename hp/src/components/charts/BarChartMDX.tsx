"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ec4899", "#64748b",
];

type DataItem = { name: string; value: number; [key: string]: unknown };
type KeyItem = { dataKey: string; name: string; color?: string };

interface BarChartMDXProps {
  data: DataItem[] | string;
  title?: string;
  unit?: string;
  color?: string;
  highlight?: string;
  layout?: "horizontal" | "vertical" | string;
  height?: number | string;
  source?: string;
  keys?: KeyItem[] | string;
}

function parse<T>(v: T | string | undefined): T | undefined {
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return undefined; }
  }
  return v as T | undefined;
}

export function BarChartMDX({
  data: rawData,
  title,
  unit = "",
  color,
  highlight,
  layout: rawLayout = "horizontal",
  height: rawHeight = 400,
  source,
  keys: rawKeys,
}: BarChartMDXProps) {
  const data = parse<DataItem[]>(rawData);
  const keys = parse<KeyItem[]>(rawKeys);
  const layout = typeof rawLayout === "string" ? rawLayout : "horizontal";
  const height = typeof rawHeight === "string" ? parseInt(rawHeight, 10) : rawHeight;
  const isVertical = layout === "vertical";
  const isStacked = keys && keys.length > 0;

  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="not-prose my-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      {title && (
        <h3 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isVertical ? "vertical" : "horizontal"}
          margin={{ top: 5, right: 20, left: isVertical ? 80 : 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={75} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip
            formatter={(value) => `${Number(value).toLocaleString()}${unit}`}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          {isStacked ? (
            <>
              <Legend />
              {keys.map((k, i) => (
                <Bar key={k.dataKey} dataKey={k.dataKey} name={k.name} stackId="a"
                  fill={k.color || COLORS[i % COLORS.length]} radius={i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </>
          ) : (
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={highlight && entry.name === highlight ? "#ef4444" : color || COLORS[index % COLORS.length]}
                  opacity={highlight && entry.name !== highlight ? 0.5 : 1}
                />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
      {source && <p className="mt-3 text-xs text-slate-400">出典: {source}</p>}
    </div>
  );
}
