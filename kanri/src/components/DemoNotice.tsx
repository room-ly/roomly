"use client";

import { useState } from "react";

export default function DemoNotice() {
  const [leaving, setLeaving] = useState(false);

  // デモ→無料登録への遷移。
  // 1. GA4イベント発火（Google広告のCVはこのイベントをキーイベント化→Adsインポートで連携）
  // 2. デモセッションをログアウト（デモはログイン中のためセッション競合を防ぐ）
  // 3. /signup?from=demo へ。?from=demo は元の広告流入(utm/gclid)を潰さず導線だけ記録する
  const handleSignup = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.(
        "event",
        "demo_to_signup_click",
        {}
      );
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ログアウト失敗してもsignupへは進める
    }
    window.location.href = "/signup?from=demo";
  };

  return (
    <div className="sticky top-0 z-40 bg-accent px-5 py-2.5 text-[12.5px] text-white leading-relaxed shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-white/20 text-white shrink-0">
          DEMO
        </span>
        <p className="flex-1 min-w-0 text-white/90">
          ここはデモ環境です。物件・契約・入居者などを自由に作成・編集・削除して動作確認していただけます。
          <span className="font-semibold text-white">編集しても料金は一切かかりません。</span>
          データは定期的に初期状態にリセットされるため、操作内容は保存されません。
        </p>
        <button
          type="button"
          onClick={handleSignup}
          disabled={leaving}
          className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-white/90 disabled:opacity-60"
        >
          {leaving ? "移動中…" : "無料で始める →"}
        </button>
      </div>
    </div>
  );
}
