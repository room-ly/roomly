export function MockRemit() {
  return (
    <div className="frame">
      <div className="frame-head">
        <span className="frame-dot" /><span className="frame-dot" /><span className="frame-dot" />
        <span className="frame-title">オーナー送金 · 確認</span>
      </div>
      <div className="frame-body">
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-rm-text-muted">
          2026年5月分 · 田中オーナー
        </div>
        <div className="mt-4 rounded-xl bg-rm-surface-tint p-4">
          <div className="flex justify-between text-[13px]">
            <span className="text-rm-text-secondary">家賃収入</span>
            <span className="font-mono">¥1,860,000</span>
          </div>
          <div className="mt-1.5 flex justify-between text-[13px] text-rm-text-muted">
            <span>− 管理手数料 5%</span>
            <span className="font-mono">−¥93,000</span>
          </div>
          <div className="mt-1.5 flex justify-between text-[13px] text-rm-text-muted">
            <span>− 修繕経費（給湯器交換）</span>
            <span className="font-mono">−¥42,800</span>
          </div>
          <div className="my-3 h-px bg-rm-border" />
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">送金額</span>
            <span className="font-serif-display text-[32px] text-rm-accent-deep tracking-tight">¥1,724,200</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 h-9 rounded-full border border-rm-border-strong text-[13px] font-medium text-rm-primary transition-colors hover:bg-rm-surface">PDF出力</button>
          <button className="flex-1 h-9 rounded-full bg-rm-accent text-[13px] font-medium text-white transition-colors hover:bg-rm-accent-deep">送金を確定</button>
        </div>
      </div>
    </div>
  );
}
