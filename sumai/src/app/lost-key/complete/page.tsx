import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function LostKeyCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <CheckCircle size={48} className="text-success mx-auto mb-4" />
        <h1 className="text-lg font-bold mb-2">紛失届を送信しました</h1>
        <p className="text-sm text-ink-3 mb-6">
          管理会社が内容を確認し、鍵の交換・再発行を手配します。
          折り返しご連絡いたします。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-deep transition-colors"
        >
          <ArrowLeft size={16} />
          マイページに戻る
        </Link>
      </div>
    </div>
  );
}
