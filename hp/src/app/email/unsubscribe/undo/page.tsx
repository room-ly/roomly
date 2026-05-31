import { resubscribeByToken } from "@/lib/email-unsubscribe";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Wrapper>
        <h1 className="text-xl font-semibold mb-4">リンクが正しくありません</h1>
        <Link href="/contact" className="text-rm-accent underline mt-6 inline-block">
          お問い合わせ
        </Link>
      </Wrapper>
    );
  }

  const result = await resubscribeByToken(token);

  if (!result.ok) {
    return (
      <Wrapper>
        <h1 className="text-xl font-semibold mb-4">リンクが無効です</h1>
        <Link href="/contact" className="text-rm-accent underline mt-6 inline-block">
          お問い合わせ
        </Link>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 className="text-xl font-semibold mb-4">配信を再開しました</h1>
      <p className="text-rm-text-2 leading-relaxed">
        {result.email} 宛のメール配信を再開しました。
      </p>
      <div className="mt-8 pt-6 border-t border-rm-border">
        <Link href="https://kanri.roomly.jp/login" className="text-rm-accent underline">
          Roomlyにログイン
        </Link>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-rm-bg flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white rounded-lg border border-rm-border p-8">
        {children}
      </div>
    </main>
  );
}
