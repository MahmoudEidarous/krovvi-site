import type { Metadata } from "next";

import { ObjectView } from "@/components/objects/object-view";
import { OBJECTS_API } from "@/lib/objects";

/**
 * A Krovvi object opened from its link (krovvi.com/o/<token>), with no app:
 * a split, a plan, a countdown someone shared. Everything shown is read in
 * the browser (components/objects/object-view.tsx); here only the title is
 * read, for the card a messaging app draws under the link.
 */

/**
 * The picture a messaging app shows under the link: the K, the wordmark and
 * "Shared from Krovvi" in the object's own language (public/object-card-*.png),
 * never its content. Not the site's picture, whose sample chat a reader could
 * take for what was shared.
 */
const CARD = (lang: "en" | "ar") => ({ url: `/object-card-${lang}.png`, width: 1200, height: 630, alt: lang === "ar" ? "متشارك من كروفي" : "Shared from Krovvi" });
const LINE = { en: "Open it to see it and take part. No app needed.", ar: "افتحه عشان تشوفه وتشارك فيه. من غير تطبيق." };
const NO_APP = { en: "No app needed.", ar: "من غير تطبيق." };

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  let title = "Krovvi";
  let lang: "en" | "ar" = "en";
  // The kind's ask, as the share sheet sends it ("Pick the days that work for you."); the plain line when there is none.
  let line: string | null = null;
  if (/^[A-Za-z0-9_-]{20,40}$/.test(token)) {
    try {
      const res = await fetch(`${OBJECTS_API}?t=${encodeURIComponent(token)}&meta=1`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      const meta = (await res.json()) as { ok?: boolean; title?: string; lang?: string; line?: string | null };
      if (meta.ok && meta.title) title = meta.title;
      if (meta.lang === "ar") lang = "ar";
      if (meta.ok && typeof meta.line === "string" && meta.line.trim()) line = meta.line.trim().slice(0, 160);
    } catch {
      // The preview keeps the plain name; the page still opens.
    }
  }
  const card = CARD(lang);
  const description = line ? `${line} ${NO_APP[lang]}` : LINE[lang];
  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    // The page's own tags replace the site's, its picture with them.
    openGraph: { type: "website", siteName: "Krovvi", title, description, images: [card] },
    twitter: { card: "summary_large_image", title, description, images: [card.url] },
  };
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ObjectView token={token} />;
}
