import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function MoveOutCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <CheckCircle size={48} className="text-success mx-auto mb-4" />
        <h1 className="text-lg font-bold mb-2">退去申請を送信しました</h1>
        <p className="text-sm text-ink-3 mb-6">
          管理会社が内容を確認します。承認後にマイページのステータスが更新されます。
          退去立会いの日程は別途ご連絡いたします。
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
