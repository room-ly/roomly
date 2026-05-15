"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="ja">
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          background: "#f5f3f0",
          color: "#2d3436",
        }}>
          <div style={{ textAlign: "center", maxWidth: "400px", padding: "20px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>
              システムエラー
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
              予期しないエラーが発生しました。ページを再読み込みしてください。
            </p>
            <button
              onClick={reset}
              style={{
                background: "#5a7a6a",
                color: "white",
                border: "none",
                padding: "8px 24px",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              再読み込み
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
