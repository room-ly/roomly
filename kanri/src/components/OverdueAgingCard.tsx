interface AgingBucket {
  count: number;
  amount: number;
}

interface OverdueAgingCardProps {
  bucket30: AgingBucket;
  bucket60: AgingBucket;
  bucket90: AgingBucket;
}

export default function OverdueAgingCard({ bucket30, bucket60, bucket90 }: OverdueAgingCardProps) {
  const total = bucket30.count + bucket60.count + bucket90.count;
  if (total === 0) return null;

  const totalAmount = bucket30.amount + bucket60.amount + bucket90.amount;
  const buckets = [
    { label: "〜30日", ...bucket30, color: "var(--warning)" },
    { label: "31〜60日", ...bucket60, color: "var(--danger)" },
    { label: "61日〜", ...bucket90, color: "#7c2d12" },
  ];

  return (
    <div className="card" style={{ marginBottom: 16, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>滞納エイジング</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
          {total}件 · ¥{totalAmount.toLocaleString()}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {buckets.map((b) => (
          <div key={b.label} style={{ flex: 1, borderLeft: `3px solid ${b.color}`, paddingLeft: 10 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{b.label}</div>
            <div className="num" style={{ fontSize: 15, color: b.count > 0 ? b.color : "var(--ink-3)" }}>
              {b.count > 0 ? `¥${b.amount.toLocaleString()}` : "—"}
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>{b.count}件</div>
          </div>
        ))}
      </div>
    </div>
  );
}
