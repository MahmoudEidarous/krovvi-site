import type { Metadata } from "next";

import { SharePage } from "@/components/share/share-page";
import { SHARE_API } from "@/lib/share";

/**
 * A chat someone shared from Krovvi (krovvi.com/s/<token>): every question
 * and answer, drawn as the app draws it. The chat is read in the browser
 * (components/share/share-page.tsx); here only its title, its language and
 * the sharer's first name (only when they chose to show it) are read, for
 * the card a messaging app draws under the link.
 */

/**
 * The picture every shared chat shows in a messaging app (public/share-card-*.png): the K and the
 * wordmark with "A chat shared from Krovvi" in the chat's language, never anything from the chat itself.
 */
const CARD = {
  en: { url: "/share-card-en.png", width: 1200, height: 630, alt: "A chat shared from Krovvi" },
  ar: { url: "/share-card-ar.png", width: 1200, height: 630, alt: "شات متشارك من كروفي" },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let title = "A chat from Krovvi";
  let lang: "en" | "ar" = "en";
  let name: string | null = null;
  if (/^[A-Za-z0-9_-]{20,40}$/.test(token)) {
    try {
      const res = await fetch(`${SHARE_API}?t=${encodeURIComponent(token)}&meta=1`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      const meta = (await res.json()) as { ok?: boolean; title?: string; lang?: string | null; name?: string | null };
      if (meta.ok && meta.title) title = meta.title;
      if (meta.ok && meta.lang === "ar") lang = "ar";
      if (meta.ok && typeof meta.name === "string" && meta.name.trim()) name = meta.name.trim();
    } catch {
      // The plain name; the page still opens.
    }
  }
  const line = lang === "ar" ? (name ? `شاركه ${name} من كروفي` : "متشارك من كروفي") : name ? `Shared by ${name} on Krovvi` : "Shared from Krovvi";
  const card = CARD[lang];
  return {
    title,
    description: line,
    robots: { index: false, follow: false, nocache: true },
    // The page's own tags replace the site's, its picture with them.
    openGraph: { type: "website", siteName: "Krovvi", title, description: line, images: [card], locale: lang === "ar" ? "ar_EG" : "en_US" },
    twitter: { card: "summary_large_image", title, description: line, images: [card.url] },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharePage token={token} />;
}
