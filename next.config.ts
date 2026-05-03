import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: undefined,
  /* Disable turbopack to avoid symlink issues in Termux */
};

export default nextConfig;
