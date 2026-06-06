import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@planr/core", "@planr/db", "@planr/config"],
};

export default nextConfig;
