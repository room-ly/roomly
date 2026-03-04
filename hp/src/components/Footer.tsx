import Link from "next/link";

const ZH_SITES = [
  { name: "LunaPos", url: "https://lunapos.jp", desc: "ナイト業界向けPOS" },
  { name: "Casinohub", url: "https://casinohub.jp", desc: "カジノ向け管理SaaS" },
  { name: "Wattly", url: "https://wattly.jp", desc: "電力メディア" },
];

export function Footer() {
  return (
    <footer className="border-t border-rm-border bg-rm-surface px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-tight text-rm-primary">Roomly</p>
            <p className="mt-1 text-[13px] text-rm-text-muted">
              賃貸管理を、もっとシンプルに。
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-[13px] text-rm-text-muted">
            <Link href="/privacy" className="transition-colors hover:text-rm-primary">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="transition-colors hover:text-rm-primary">
              利用規約
            </Link>
            <Link href="/legal" className="transition-colors hover:text-rm-primary">
              特定商取引法
            </Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-rm-border">
          <p className="text-xs text-rm-text-muted mb-2">zh運営サイト</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-1">
            {ZH_SITES.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rm-text-muted transition-colors hover:text-rm-primary"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-rm-text-muted">
          &copy; {new Date().getFullYear()} Roomly
        </p>
      </div>
    </footer>
  );
}
