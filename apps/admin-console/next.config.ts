import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@frotas/contracts", "@frotas/domain"],
};

export default nextConfig;
