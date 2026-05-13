export function HeroVisual() {
  return (
    <div className="relative h-[480px] sm:h-[520px]" aria-hidden>
      {/* Dashboard mock */}
      <div className="tile absolute top-5 left-0 w-[70%] sm:w-[78%] overflow-hidden p-0" style={{ transform: "rotate(-1.2deg)" }}>
        <div className="frame-head">
          <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
          <span className="frame-title">roomly.jp / dashboard</span>
        </div>
        <div className="p-[18px]">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-rm-text-muted">稼働率</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif-display text-[44px] leading-none text-rm-primary">96.4</span>
            <span className="text-[14px] text-rm-text-muted">%</span>
            <span className="ml-auto text-[11px] text-rm-accent-deep bg-rm-accent-tint px-2 py-0.5 rounded-full">+2.1</span>
          </div>
          <svg viewBox="0 0 240 60" className="mt-3 w-full" height="60">
            <defs>
              <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--rm-accent)" stopOpacity=".35" />
                <stop offset="100%" stopColor="var(--rm-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,42 L20,38 L40,40 L60,32 L80,30 L100,24 L120,28 L140,18 L160,22 L180,12 L200,16 L220,8 L240,12 L240,60 L0,60 Z" fill="url(#hg)" />
            <path d="M0,42 L20,38 L40,40 L60,32 L80,30 L100,24 L120,28 L140,18 L160,22 L180,12 L200,16 L220,8 L240,12" fill="none" stroke="var(--rm-accent)" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            {[["稼働", "412/427"], ["滞納", "3件"], ["契約満了", "8件"]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-rm-surface-tint px-2.5 py-2">
                <div className="text-[10px] text-rm-text-muted">{k}</div>
                <div className="mt-0.5 text-[13px] font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rent payment tile */}
      <div className="tile absolute top-0 right-0 w-[160px] sm:w-[200px]" style={{ transform: "rotate(2.5deg)" }}>
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-[7px] bg-rm-accent-tint text-rm-accent-deep">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="6" width="18" height="12" rx="1.5" /><circle cx="12" cy="12" r="2.6" /></svg>
          </div>
          <div className="text-[12px] text-rm-text-muted">家賃入金</div>
        </div>
        <div className="mt-2 text-[22px] font-medium tracking-tight">¥78,000</div>
        <div className="mt-1 text-[12px] text-rm-text-muted">301号室 · 山田 様</div>
      </div>

      {/* Maintenance tile */}
      <div className="tile absolute top-[300px] sm:top-[250px] right-[10px] sm:right-[30px] w-[190px] sm:w-[220px]" style={{ transform: "rotate(-2deg)" }}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#d97757]" />
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-rm-text-muted">修繕依頼 · 対応中</div>
        </div>
        <div className="mt-2.5 text-[13px] font-semibold">給湯器の不調</div>
        <div className="mt-1 text-[12px] text-rm-text-muted">グランド青山 · 1204号</div>
        <div className="mt-2.5 flex gap-1">
          {["受付", "見積", "施工", "完了"].map((s, i) => (
            <div key={s} className="h-1 flex-1 rounded-full" style={{ background: i < 2 ? "var(--rm-accent)" : "var(--rm-border)" }} />
          ))}
        </div>
      </div>

      {/* Owner remittance tile */}
      <div className="tile absolute bottom-0 left-[20px] sm:left-[60px] w-[200px] sm:w-[230px]" style={{ transform: "rotate(1.5deg)" }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-rm-text-muted">オーナー送金 · 5月分</div>
        <div className="mt-2 text-[22px] font-medium tracking-tight">¥2,847,500</div>
        <div className="mt-3 flex justify-between text-[11px] text-rm-text-muted">
          <span>承認済 · 12件</span>
          <span className="text-rm-accent-deep">送金準備完了 →</span>
        </div>
      </div>
    </div>
  );
}
