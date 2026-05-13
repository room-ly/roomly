export function MockProperties() {
  const rows = [
    { name: "グランド青山", units: "12 / 14", rent: "¥1,820,000", status: "ok" },
    { name: "メゾン代官山", units: "8 / 8", rent: "¥1,240,000", status: "full" },
    { name: "ヴェルデ三軒茶屋", units: "6 / 9", rent: "¥740,000", status: "warn" },
    { name: "コーポ恵比寿", units: "10 / 10", rent: "¥1,180,000", status: "full" },
  ];

  return (
    <div className="frame">
      <div className="frame-head">
        <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
        <span className="frame-title">物件一覧 · 32件</span>
      </div>
      <div>
        <div className="flex px-[18px] py-2.5 border-b border-rm-border font-mono text-[10px] uppercase tracking-[0.1em] text-rm-text-muted">
          <span className="flex-[1.6]">物件名</span>
          <span className="flex-1">稼働</span>
          <span className="flex-1 text-right">月額家賃</span>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="flex items-center px-[18px] py-3.5 border-b border-rm-border text-[13px]">
            <span className="flex-[1.6] flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-rm-surface-tint text-rm-text-secondary">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="4" y="3" width="10" height="18" rx="1.2" /><rect x="14" y="9" width="6" height="12" rx="1.2" /></svg>
              </span>
              <span className="font-medium">{r.name}</span>
            </span>
            <span className="flex-1 flex items-center gap-1.5">
              <span className={`h-[7px] w-[7px] rounded-full ${r.status === "full" ? "bg-rm-accent" : r.status === "warn" ? "bg-[#d97757]" : "bg-rm-text-muted"}`} />
              <span className="text-rm-text-secondary">{r.units}</span>
            </span>
            <span className="flex-1 text-right font-mono text-[12px]">{r.rent}</span>
          </div>
        ))}
        <div className="flex justify-between px-[18px] py-3.5 text-[12px] text-rm-text-muted">
          <span>合計 36件中 4件を表示</span>
          <span className="text-rm-accent-deep">すべて表示 →</span>
        </div>
      </div>
    </div>
  );
}
