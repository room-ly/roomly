"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center mx-auto mb-4">
          <span className="text-danger text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-text mb-2">
          エラーが発生しました
        </h2>
        <p className="text-[13px] text-text-muted mb-6 leading-relaxed">
          予期しないエラーが発生しました。問題が続く場合は、サポートまでお問い合わせください。
        </p>
        <button
          onClick={reset}
          className="btn-primary"
        >
          再試行する
        </button>
      </div>
    </div>
  );
}
