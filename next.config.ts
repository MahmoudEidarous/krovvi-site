import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // One canonical host. www lands on the apex, permanently.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.krovvi.com" }],
        destination: "https://krovvi.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
