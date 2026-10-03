import type { NextConfig } from "next";

/**
 * Pages opened by a link someone was sent (an object, a shared chat): never
 * in a search engine or an archive, never cached, and the link never passed
 * on to whatever they tap next. The page itself says noindex too; robots.txt
 * must not block these paths, or a crawler could never read that.
 */
const PRIVATE_LINK_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store" },
  { key: "Referrer-Policy", value: "no-referrer" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/o/:path*", headers: PRIVATE_LINK_HEADERS },
      { source: "/s/:path*", headers: PRIVATE_LINK_HEADERS },
    ];
  },
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
