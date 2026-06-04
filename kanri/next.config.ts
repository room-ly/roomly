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
