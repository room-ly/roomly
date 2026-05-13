import Link from "next/link";

const ZH_SITES = [
  { name: "LunaPos", url: "https://lunapos.jp" },
  { name: "Kaigaijin", url: "https://kaigaijin.jp" },
  { name: "Casinohub", url: "https://casinohub.jp" },
  { name: "Wattly", url: "https://wattly.jp" },
];

export function Footer() {
  return (
    <footer className="border-t border-rm-border px-7 pt-16 pb-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-[17px] tracking-tight text-rm-primary mb-3">
              <span className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-rm-primary text-rm-bg font-serif-display text-[17px] italic">
                R
              </span>
              <span>Roomly</span>
            </Link>
            <p className="text-[13px] text-rm-text-muted leading-relaxed max-w-[28ch]">
              賃貸管理会社向けSaaS。物件・入居者・契約・家賃・修繕・送金を一つの画面で。
            </p>
          </div>

          <div>
            <h5 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-rm-text-muted">
              Product
            </h5>
            <div className="space-y-2.5">
              <Link href="/features" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">機能</Link>
              <Link href="/pricing" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">料金</Link>
              <a href="https://roomly.jp/login?demo=1" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">デモを試す</a>
            </div>
          </div>

          <div>
            <h5 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-rm-text-muted">
              Resources
            </h5>
            <div className="space-y-2.5">
              <Link href="/column" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">コラム</Link>
              <Link href="/faq" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">よくある質問</Link>
            </div>
          </div>

          <div>
            <h5 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.1em] text-rm-text-muted">
              Company
            </h5>
            <div className="space-y-2.5">
              <Link href="/contact" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">お問い合わせ</Link>
              <Link href="/privacy" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">プライバシー</Link>
              <Link href="/terms" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">利用規約</Link>
              <Link href="/legal" className="block text-[14px] text-rm-text-secondary hover:text-rm-primary transition-colors">特定商取引法</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-rm-border">
          <p className="text-[11px] text-rm-text-muted mb-2">zh グループ</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {ZH_SITES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-rm-text-muted transition-colors hover:text-rm-primary"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-rm-border flex justify-between flex-wrap gap-4 text-[12px] text-rm-text-muted">
          <span>&copy; {new Date().getFullYear()} Roomly</span>
        </div>
      </div>
    </footer>
  );
}
