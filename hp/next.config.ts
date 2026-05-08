import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/pricing",
        destination: "/#pricing",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
