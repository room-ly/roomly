import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // 「経費」→「費用」リネームに伴い /expenses を /costs に恒久リダイレクト
      // (ブックマーク・既存通知リンクの互換。APIルート /api/expenses は対象外)
      { source: "/expenses", destination: "/costs", permanent: true },
      { source: "/expenses/:path*", destination: "/costs/:path*", permanent: true },
      // 「月次精算」を「振込」に統合。/remittances 画面は廃止し /payments に恒久リダイレクト
      // (オーナー精算の計算・確定は振込画面に統合済み。台帳・PDFはオーナー詳細へ。
      //  API /api/remittances/:id/pdf は存続するので対象外)
      { source: "/remittances", destination: "/payments", permanent: true },
      { source: "/remittances/:id", destination: "/payments", permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentryの設定（DSN未設定時はビルドに影響しない）
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  silent: true,
  widenClientFileUpload: true,
  // disableLogger / automaticVercelMonitors はトップレベル指定が非推奨になったため
  // webpack 配下に移動（@sentry/nextjs の新しい書き方）
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
