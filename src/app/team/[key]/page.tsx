import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeamBoard } from "@/components/team/board";
import { isBoardKey } from "@/lib/team";

/**
 * The team board (krovvi.com/team/<key>): who used Krovvi, when and how much,
 * live, for the founders. Each of them has their own link; the key in it is
 * what the database checks (catch8 supabase migration team_board), so the
 * page holds no secret and asks for nothing until it is in a browser.
 *
 * Saved to a home screen it opens on its own, full screen, on this same link
 * (its own manifest, manifest.webmanifest beside this page).
 */
export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const ok = isBoardKey(key);
  return {
    title: { absolute: "Krovvi Team" },
    description: "Who used Krovvi, when and how much, live.",
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
    manifest: ok ? `/team/${key}/manifest.webmanifest` : undefined,
    appleWebApp: { capable: true, title: "Krovvi Team", statusBarStyle: "black-translucent" },
    other: { "apple-mobile-web-app-capable": "yes" },
  };
}

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isBoardKey(key)) notFound();
  return <TeamBoard boardKey={key} />;
}
