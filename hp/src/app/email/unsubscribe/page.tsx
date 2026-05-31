import { unsubscribeByToken } from "@/lib/email-unsubscribe";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ token?: string; undo?: string }>;
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token, undo } = await searchParams;

  if (!token) {
    return (
      <Wrapper>
        <h1 className="text-xl font-semibold mb-4">配信停止リンクが正しくありません</h1>
        <p className="text-rm-text-2">トークンが見つかりませんでした。お手数ですが運営までお問い合わせください。</p>
        <Link href="/contact" className="text-rm-accent underline mt-6 inline-block">
          お問い合わせ
        </Link>
      </Wrapper>
    );
  }

  const result = await unsubscribeByToken(token);

  if (!result.ok) {
    return (
      <Wrapper>
        <h1 className="text-xl font-semibold mb-4">配信停止リンクが無効です</h1>
        <p className="text-rm-text-2">
          リンクの有効期限が切れているか、すでに使用済みの可能性があります。
        </p>
        <Link href="/contact" className="text-rm-accent underline mt-6 inline-block">
          お問い合わせ
        </Link>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h1 className="text-xl font-semibold mb-4">配信を停止しました</h1>
      <p className="text-rm-text-2 leading-relaxed">
        今後、Roomlyからのご案内メールは {result.email} 宛にお送りしません。
        <br />
        サービス運営上必要な通知(契約・請求・セキュリティ等)はお送りする場合があります。
      </p>

      <div className="mt-8 pt-6 border-t border-rm-border text-sm text-rm-text-3">
        <p className="mb-3">誤ってクリックされた場合は、以下から元に戻せます。</p>
        <Link
          href={`/email/unsubscribe/undo?token=${token}`}
          className="text-rm-accent underline"
        >
          配信を再開する
        </Link>
      </div>

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
