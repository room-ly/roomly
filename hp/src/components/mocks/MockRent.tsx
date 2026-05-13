export function MockRent() {
  const rows = [
    { who: "山田 太郎", room: "301号", amt: "¥78,000", state: "paid" as const },
    { who: "佐藤 美咲", room: "402号", amt: "¥85,000", state: "paid" as const },
    { who: "高橋 健一", room: "105号", amt: "¥72,000", state: "due" as const },
    { who: "鈴木 花", room: "203号", amt: "¥80,000", state: "late" as const },
  ];

  const badge = (s: "paid" | "due" | "late") => {
    if (s === "paid") return { label: "入金済", bg: "bg-rm-accent-tint", fg: "text-rm-accent-deep" };
    if (s === "due") return { label: "請求中", bg: "bg-rm-surface-tint", fg: "text-rm-text-secondary" };
    return { label: "滞納", bg: "bg-[#fbe6dc]", fg: "text-[#a14a25]" };
  };

  return (
    <div className="frame">
      <div className="frame-head">
        <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
        <span className="frame-title">家賃台帳 · 2026年5月</span>
      </div>
      <div>
        <div className="flex items-center gap-3.5 px-[18px] py-4 border-b border-rm-border">
          {[["回収率", "94%"], ["請求", "427件"], ["滞納", "3件"]].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-[0.1em] text-rm-text-muted">{k}</div>
              <div className="mt-0.5 text-[16px] font-semibold">{v}</div>
            </div>
          ))}
          <div className="ml-auto text-[11px] text-rm-text-muted">5月</div>
        </div>
        {rows.map((r) => {
          const b = badge(r.state);
          return (
            <div key={r.who} className="flex items-center px-[18px] py-3 border-b border-rm-border text-[13px]">
              <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-rm-surface-tint font-serif-display italic text-[13px] text-rm-text-secondary shrink-0">
                {r.who[0]}
              </span>
              <span className="ml-3 font-medium">{r.who}</span>
              <span className="ml-2 text-rm-text-muted text-[12px]">{r.room}</span>
              <span className="ml-auto mr-3 font-mono text-[12px]">{r.amt}</span>
              <span className={`${b.bg} ${b.fg} text-[11px] px-2.5 py-[3px] rounded-full font-medium`}>{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
