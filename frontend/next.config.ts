import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for better compatibility with static hosting folders
  trailingSlash: true,
};

export default nextConfig;
