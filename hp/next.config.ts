import type { NextConfig } from "next";

// 旧 /tools/{slug}-template → 新 /templates/{slug}（テンプレを独立階層へ移動）
// 定義は src/lib/tools.ts の TEMPLATE_TOOLS と対応。テンプレ追加時はここにも1行足す。
const TEMPLATE_REDIRECTS: { source: string; destination: string }[] = [
  { source: "/tools/rent-ledger-template", destination: "/templates/rent-ledger" },
  { source: "/tools/move-out-settlement-template", destination: "/templates/move-out-settlement" },
  { source: "/tools/restoration-burden-template", destination: "/templates/restoration-burden-sheet" },
  { source: "/tools/contract-renewal-notice-template", destination: "/templates/contract-renewal-notice" },
  { source: "/tools/owner-remittance-statement-template", destination: "/templates/owner-remittance-statement" },
  { source: "/tools/rent-demand-letter-template", destination: "/templates/rent-demand-letter" },
  { source: "/tools/property-list-template", destination: "/templates/property-list" },
  { source: "/tools/move-in-checklist-template", destination: "/templates/move-in-checklist" },
  { source: "/tools/key-receipt-template", destination: "/templates/key-receipt" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return TEMPLATE_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
