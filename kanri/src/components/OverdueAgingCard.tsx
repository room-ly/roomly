"use client";

import { useState } from "react";
import Link from "next/link";

interface AgingItem {
  id: string;
  due_date: string;
  days_overdue: number;
  unpaid_amount: number;
  total_amount: number;
  tenant_name: string | null;
  property_name: string | null;
  unit_number: string | null;
}

interface AgingBucket {
  count: number;
  amount: number;
  items: AgingItem[];
}

interface OverdueAgingCardProps {
  bucket30: AgingBucket;
  bucket60: AgingBucket;
  bucket90: AgingBucket;
}

export default function OverdueAgingCard({ bucket30, bucket60, bucket90 }: OverdueAgingCardProps) {
  const total = bucket30.count + bucket60.count + bucket90.count;
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (total === 0) return null;

  const totalAmount = bucket30.amount + bucket60.amount + bucket90.amount;
  const buckets = [
    { key: "30", label: "〜30日", bucket: bucket30, color: "var(--warning)" },
    { key: "60", label: "31〜60日", bucket: bucket60, color: "var(--danger)" },
    { key: "90", label: "61日〜", bucket: bucket90, color: "#7c2d12" },
  ];

  const openBucket = buckets.find((b) => b.key === openKey);

  return (
    <div className="card" style={{ marginBottom: 16, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>滞納エイジング</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {total}件 · ¥{totalAmount.toLocaleString()}
        </span>
        <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: "auto" }}>
          バケットをクリックで内訳表示
        </span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {buckets.map((b) => {
          const isOpen = openKey === b.key;
          const disabled = b.bucket.count === 0;
          return (
            <button
              key={b.key}
              type="button"
              disabled={disabled}
              onClick={() => setOpenKey(isOpen ? null : b.key)}
              style={{
                flex: 1,
                borderLeft: `3px solid ${b.color}`,
                paddingLeft: 10,
                paddingTop: 4,
                paddingBottom: 4,
                textAlign: "left",
                background: isOpen ? "var(--bg-2)" : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.6 : 1,
                transition: "background .15s",
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isOpen) e.currentTarget.style.background = "var(--bg-2)";
              }}
              onMouseLeave={(e) => {
                if (!isOpen) e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{b.label}</div>
              <div
                className="num"
                style={{ fontSize: 15, color: b.bucket.count > 0 ? b.color : "var(--ink-3)" }}
              >
                {b.bucket.count > 0 ? `¥${b.bucket.amount.toLocaleString()}` : "—"}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                {b.bucket.count}件
              </div>
            </button>
          );
        })}
      </div>

      {openBucket && openBucket.bucket.items.length > 0 && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>
            {openBucket.label} の内訳（{openBucket.bucket.count}件）
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {openBucket.bucket.items.map((it) => (
              <Link
                key={it.id}
                href={`/rent/${it.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 12,
                  alignItems: "baseline",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "var(--ink)",
                  textDecoration: "none",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>
                  <span style={{ fontWeight: 500 }}>{it.tenant_name ?? "—"}</span>
                  <span style={{ color: "var(--ink-3)", marginLeft: 6, fontSize: 11 }}>
                    {it.property_name ?? ""}
                    {it.unit_number ? ` ${it.unit_number}` : ""}
                  </span>
                </span>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  期限 {it.due_date}（{it.days_overdue}日超過）
                </span>
                <span className="mono" style={{ color: "var(--danger)" }}>
                  ¥{it.unpaid_amount.toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
