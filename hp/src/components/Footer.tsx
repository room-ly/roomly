import Link from "next/link";

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
        <p className="mt-10 text-center text-xs text-rm-text-muted">
          &copy; {new Date().getFullYear()} Roomly
        </p>
      </div>
    </footer>
  );
}
