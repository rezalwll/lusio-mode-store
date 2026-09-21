import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Narrow allow-list: all 385 catalog images are absolute https URLs on
    // this single WordPress-uploads host (verified against assets/data).
    remotePatterns: [
      { protocol: "https", hostname: "elevenstyle.ir", pathname: "/wp-content/uploads/**" },
    ],
  },
};

export default nextConfig;
