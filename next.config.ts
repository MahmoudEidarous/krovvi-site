import type { NextConfig } from "next";

/**
 * Pages opened by a link someone was sent (an object, a shared chat, a question for friends, a Together post or
 * invite): never
 * in a search engine or an archive, never cached, and the link never passed
 * on to whatever they tap next. The page itself says noindex too; robots.txt
 * must not block these paths, or a crawler could never read that.
 */
const PRIVATE_LINK_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store" },
  { key: "Referrer-Policy", value: "no-referrer" },
];

/** A shortcut file: downloaded, never shown as text, under its own name. */
const shortcutHeaders = (name: string) => [
  { key: "Content-Type", value: "application/octet-stream" },
  { key: "Content-Disposition", value: `attachment; filename="${name}"` },
  { key: "X-Robots-Tag", value: "noindex" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/o/:path*", headers: PRIVATE_LINK_HEADERS },
      { source: "/s/:path*", headers: PRIVATE_LINK_HEADERS },
      // A question someone's Krovvi made for their friends.
      { source: "/a/:path*", headers: PRIVATE_LINK_HEADERS },
      // Krovvi Together: a post someone sent (an episode, two Krovvis talking, a plan, a character) and an invite.
      { source: "/e/:path*", headers: PRIVATE_LINK_HEADERS },
      { source: "/k/:path*", headers: PRIVATE_LINK_HEADERS },
      // The founders' board and their outreach list: links only they have.
      { source: "/team/:path*", headers: PRIVATE_LINK_HEADERS },
      // Dev views, now and later: never in a search engine, even one whose page forgets to say so.
      { source: "/dev/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // The pitch deck is for the people it is sent to: link previews draw, search engines skip it.
      { source: "/deck", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/deck/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // The two signed Apple Shortcuts Money's link screen offers (catch8 assets/shortcuts, src/app/money-link.tsx):
      // a download, saved under the name the app's steps tell them to choose ("Krovvi Bank Texts", "Krovvi Apple Pay"),
      // since a shortcut added from a file takes the file's name. Each asks for the person's own link as it is added,
      // so the files hold no one's link.
      { source: "/shortcuts/krovvi-bank-texts.shortcut", headers: shortcutHeaders("Krovvi Bank Texts.shortcut") },
      { source: "/shortcuts/krovvi-apple-pay.shortcut", headers: shortcutHeaders("Krovvi Apple Pay.shortcut") },
    ];
  },
  async rewrites() {
    // krovvi.com/deck opens the deck's own page (public/deck, a standalone HTML deck with a /deck/ base).
    // krovvi.com/team/outreach is the founders' investor list (public/team/outreach): sealed, it opens
    // only with the key after the # in one of their two links, so the public code holds nothing readable.
    return [
      { source: "/deck", destination: "/deck/index.html" },
      { source: "/team/outreach", destination: "/team/outreach/index.html" },
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
