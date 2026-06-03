import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
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
