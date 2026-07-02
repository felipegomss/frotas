import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@frotas/contracts", "@frotas/domain", "@frotas/ui"],
};

export default nextConfig;
